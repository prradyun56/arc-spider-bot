from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import gymnasium as gym
from stable_baselines3 import PPO
import asyncio
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD BRAIN ---
model = None
env = None

try:
    if os.path.exists("spider_brain.zip"):
        print("🧠 Loading Trained Brain...")
        model = PPO.load("spider_brain", device="cpu")
        print("✅ Brain Loaded!")
    else:
        print("⚠️ No brain file found. Using dummy brain.")
        env = gym.make("Ant-v4")
        model = PPO("MlpPolicy", env)
except Exception as e:
    print(f"⚠️ Error loading brain: {e}")

# Create Environment
try:
    env = gym.make("Ant-v4", render_mode="rgb_array")
except:
    print("⚠️ Physics engine warning. Using basic environment.")
    env = gym.make("Ant-v4")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Client Connected! Starting Neural Stream...")
    
    obs, _ = env.reset()
    step_count = 0
    
    try:
        while True:
            # 1. PREDICT
            if model:
                action, _ = model.predict(obs, deterministic=False)
            else:
                action = env.action_space.sample()

            # 2. STEP
            obs, reward, terminated, truncated, info = env.step(action)
            step_count += 1
            
            # 3. EXTRACT (Get all 8 joints)
            joints = obs[6:14]
            
            data = {
                # Leg 1 (Front Left)
                "l1_hip": float(joints[0]),
                "l1_knee": float(joints[1]),
                # Leg 2 (Front Right)
                "l2_hip": float(joints[2]),
                "l2_knee": float(joints[3]),
                # Leg 3 (Back Left)
                "l3_hip": float(joints[4]),
                "l3_knee": float(joints[5]),
                # Leg 4 (Back Right)
                "l4_hip": float(joints[6]),
                "l4_knee": float(joints[7]),
                
                "step": step_count,
                "status": "ACTIVE"
            }
            
            # 4. SEND
            await websocket.send_text(json.dumps(data))

            # --- DEBUG LOG (UPDATED TO FIX THE CRASH) ---
            if step_count % 50 == 0:
                print(f"Step {step_count} | Hip1: {data['l1_hip']:.2f}") 
            
            # 5. RESET
            if terminated or truncated or step_count > 1000:
                obs, _ = env.reset()
                step_count = 0
                
            await asyncio.sleep(0.05)
            
    except Exception as e:
        print(f"❌ Error in loop: {e}")
        # The connection closes here because of the error