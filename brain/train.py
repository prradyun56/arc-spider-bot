import gymnasium as gym
from stable_baselines3 import PPO
import os

# 1. Create the Environment (The "Ant" is basically a 4-legged spider)
# render_mode="rgb_array" runs it faster without opening a window
print("Initializing the Simulation...")
env = gym.make("Ant-v4", render_mode="rgb_array")

# 2. Create the Brain (PPO Agent)
print("Creating the Brain...")
model = PPO("MlpPolicy", env, verbose=1)

# 3. Train! (The Learning Process)
# For a hackathon demo, 10,000 steps is enough to show it trying.
# Real walking takes ~1,000,000 steps (hours).
print("Training started... (This might take a minute)")
model.learn(total_timesteps=10000) 

# 4. Save the Graduate
print("Training finished! Saving the brain...")
model.save("spider_brain.zip")
print("Saved as spider_brain.zip")