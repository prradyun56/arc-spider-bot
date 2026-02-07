# ARC-01: Autonomous Reinforcement Learning Spider 🕷️

> A "Digital Twin" experiment bridging Python (Stable Baselines 3) and Next.js (Three.js).

![Project Status](https://img.shields.io/badge/Status-Operational-green)
![Tech Stack](https://img.shields.io/badge/Stack-MERN_%2B_Python-blue)

## 🚨 The Concept
Inspired by the machine ecology of *ARC Raiders*, this project simulates a quadrupedal robot learning to walk from scratch. 
The "Brain" runs a PPO (Proximal Policy Optimization) neural network in real-time, streaming joint angles via WebSockets to a React-based 3D visualizer.

## 🛠️ Architecture
* **Brain (Backend):** Python, FastAPI, Stable Baselines 3, Gymnasium (Ant-v4).
* **Nervous System:** WebSockets (100ms latency).
* **Body (Frontend):** Next.js 14, React Three Fiber, Tailwind CSS.

## 🚀 How to Run
### 1. Start the Brain 🧠
```bash
cd brain
# Activate virtual env
.\venv\Scripts\Activate
# Run the neural server
uvicorn main:app --reload