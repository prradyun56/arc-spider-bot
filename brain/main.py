from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import gymnasium as gym
from stable_baselines3 import PPO
import asyncio
import json
import math
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
# Brain State
robot_x = 0.0
robot_y = 0.0
robot_angle = 0.0
current_speed = 0.0

# "Organic" AI State
behavior_state = "IDLE" # IDLE or MOVING
state_timer = 0         # How long to stay in this state

target_x = random.uniform(-15, 15)
target_y = random.uniform(-15, 15)

# Load Physics Engine
env = gym.make("Ant-v4", render_mode="rgb_array")
try:
    model = PPO.load("spider_brain", device="cpu")
    print("✅ Brain Loaded!")
except:
    print("⚠️ No brain found. Using random actions.")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global robot_x, robot_y, robot_angle, target_x, target_y, current_speed, behavior_state, state_timer
    
    await websocket.accept()
    obs, _ = env.reset()
    
    try:
        while True:
            # --- 1. ORGANIC BEHAVIOR LOGIC ---
            state_timer -= 1
            if state_timer <= 0:
                # Time to switch behavior!
                if behavior_state == "IDLE":
                    behavior_state = "MOVING"
                    state_timer = random.randint(100, 300) # Move for 5-15 seconds
                    print("🤖 Status: MOVING")
                else:
                    behavior_state = "IDLE"
                    state_timer = random.randint(40, 100)  # Pause for 2-5 seconds
                    print("🤖 Status: SCANNING...")

            # --- 2. NAVIGATION ---
            dx = target_x - robot_x
            dy = target_y - robot_y
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist < 2.0:
                target_x = random.uniform(-20, 20)
                target_y = random.uniform(-20, 20)

            # Steering
            desired_angle = math.atan2(dy, dx)
            angle_diff = desired_angle - robot_angle
            while angle_diff > math.pi: angle_diff -= 2 * math.pi
            while angle_diff < -math.pi: angle_diff += 2 * math.pi
            
            # Turn virtual body
            turn_speed = 0.05
            if angle_diff > 0: robot_angle += turn_speed
            if angle_diff < 0: robot_angle -= turn_speed

            # Acceleration / Deceleration Logic
            target_speed = 0.15 if behavior_state == "MOVING" else 0.0
            # Smoothly ramp speed up/down (Inertia)
            current_speed += (target_speed - current_speed) * 0.05
            
            # Apply Velocity
            robot_x += math.cos(robot_angle) * current_speed
            robot_y += math.sin(robot_angle) * current_speed

            # --- 3. PHYSICS STEP ---
            if model:
                action, _ = model.predict(obs, deterministic=False)
            else:
                action = env.action_space.sample()
            
            obs, _, terminated, _, _ = env.step(action)
            joints = obs[6:14]

            # --- 4. SEND DATA ---
            data = {
                "l1_hip": float(joints[0]), "l1_knee": float(joints[1]),
                "l2_hip": float(joints[2]), "l2_knee": float(joints[3]),
                "l3_hip": float(joints[4]), "l3_knee": float(joints[5]),
                "l4_hip": float(joints[6]), "l4_knee": float(joints[7]),
                "x": robot_x,
                "z": robot_y, 
                "rot": -robot_angle,
                "tx": target_x, 
                "tz": target_y,
                "status": behavior_state # Send state to UI
            }
            
            await websocket.send_text(json.dumps(data))

            if terminated: obs, _ = env.reset()
            await asyncio.sleep(0.05)

    except Exception as e:
        print(f"❌ Error: {e}")