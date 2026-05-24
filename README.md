# 🏋️ Ascend Fit

A full-stack fitness tracking web app built with React + Firebase. Track your workouts, nutrition, and muscle development — and climb a 50-rank progression system from Iron to Ascendant.

---

## Features

- **Workout Logger** — Log exercises with sets, reps, weight, and RPE. Auto-calculates calories burned and rank points earned per session.
- **Nutrition Tracker** — Track calories, macros (protein/carbs/fat/fiber), and micros. 300+ Indian & international foods. Build and save custom dishes/recipes.
- **Muscle Map** — Interactive body model (front + back) showing development level per muscle group based on your workout history.
- **50-Rank System** — Earn points from volume, compound lifts, and consistency. Climb from Iron I all the way to Ascendant V.
- **Dashboard** — Daily snapshot of nutrition, recent workouts, rank progress, and quick-action buttons.
- **Profile & Settings** — Manage your weight, height, calorie goals, macro targets, and training experience.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Auth | Firebase Authentication (Email + Google) |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting |

---

## Project Structure

```
src/
├── components/
│   └── Layout.jsx          # Sidebar + mobile nav shell
├── pages/
│   ├── Landing.jsx          # Public landing page
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── CompleteProfile.jsx  # Post-Google-signup profile setup
│   ├── Dashboard.jsx
│   ├── Workouts.jsx
│   ├── Nutrition.jsx
│   ├── MuscleMap.jsx
│   ├── Rankings.jsx
│   └── Profile.jsx
├── firebase.js              # Firebase SDK init
├── App.jsx                  # Routes + auth guard
└── main.jsx
```

---

## Rank System

50 ranks across 10 tiers, each with 5 divisions (I–V):

| Tier | Color |
|---|---|
| Iron | Gray |
| Bronze | Bronze |
| Silver | Silver |
| Gold | Gold |
| Platinum | White |
| Diamond | Cyan |
| Emerald | Green |
| Ruby | Red |
| Sapphire | Blue |
| Ascendant | Orange |

Points are earned per workout based on total volume, compound exercise count, and exercise variety. Early ranks progress fast — higher ranks require significantly more effort, modelling real strength gains.

---

## 🍎 Nutrition Tracker

The nutrition tracking system allows users to monitor their daily intake and maintain consistency with their fitness goals.

### Features

- Track daily calories and macronutrients (protein, carbs, fats, fiber)  
- Access a database of 300+ Indian and international food items  
- Create and save custom meals and recipes  
- Real-time updates to daily intake totals  

This system is designed to simplify dietary tracking while ensuring users stay aligned with their fitness and performance goals.

---

## 🧍 Muscle Map

The Muscle Map provides a visual representation of muscle development based on the user’s workout history.

### Features

- Interactive front and back body views  
- Muscle groups update dynamically based on training frequency  
- Visual feedback on undertrained and well-developed areas  

This feature helps users identify imbalances, optimize their training, and maintain a balanced physique over time.

---

## Firestore Security

All user data is private by default. Users can only read and write their own documents. The leaderboard on the Rankings page reads rank/points fields from all authenticated users.

See `firestore.rules` for the full ruleset.

---

## 🌐 Live Demo

https://ascend-fit-12.firebaseapp.com/

---

Developed by Arvin Almeida