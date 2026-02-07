from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import gymnasium as gym
from stable_baselines3 import PPO
import asyncio
import json
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
# Check if the file exists first to avoid crashes
try:
    print("Loading Spider Brain...")
    model = PPO.load("spider_brain", device="cpu")
    print("Brain Loaded Successfully! 🧠")
except:
    print("⚠️ brain file not found! creating a dummy model for testing.")
    env = gym.make("Ant-v4")
    model = PPO("MlpPolicy", env)

# Create environment
env = gym.make("Ant-v4", render_mode="rgb_array")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client Connected! Starting Loop...")
    
    obs, _ = env.reset()
    step_count = 0

    try:
        while True:
            # Predict action
            action, _ = model.predict(obs, deterministic=False) # False = allow some creative wiggling
            
            # Step simulation
            obs, reward, terminated, truncated, info = env.step(action)
            step_count += 1
            
            # Extract joints (Ant-v4 specific indices)
            # We use a bit of randomness if the values are identical to 'kick' it start
            joints = obs[6:14]
            
            data = {
                "leg1": float(joints[0]), 
                "leg2": float(joints[2]),
                "leg3": float(joints[4]), 
                "leg4": float(joints[6]),
                "step": step_count # Send step count to prove it's alive
            }
            
            # Send to frontend
            await websocket.send_text(json.dumps(data))
            
            # Print to terminal so YOU can see if it's working
            if step_count % 10 == 0:
                print(f"Step {step_count} | Sending: {data['leg1']:.4f}")

            # Reset if fallen over OR if it's been running too long (to keep it fresh)
            if terminated or truncated or step_count > 1000:
                print("Spider fell! Resetting simulation... 🔄")
                obs, _ = env.reset()
                step_count = 0
                
            # Keep the speed manageable
            await asyncio.sleep(0.05)
            
    except Exception as e:
        print(f"Error in loop: {e}")
        await websocket.close()