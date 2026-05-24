import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection, addDoc, getDocs, query, where,
  orderBy, serverTimestamp, doc, getDoc, deleteDoc
} from 'firebase/firestore';
import { Plus, Search, X, Trash2, ChevronDown, ChevronUp, Save, UtensilsCrossed, BookOpen } from 'lucide-react';


const FOOD_DB = [
  // Proteins - Meat & Seafood (Common in Catholic homes)
  { name: "Chicken Breast", cal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, category: "Protein" },
  { name: "Chicken Thigh", cal: 239, protein: 26, carbs: 0, fat: 14, fiber: 0, category: "Protein" },
  { name: "Chicken Liver", cal: 167, protein: 24, carbs: 0, fat: 6.5, fiber: 0, category: "Protein" },
  { name: "Mutton (Goat Meat)", cal: 294, protein: 25, carbs: 0, fat: 21, fiber: 0, category: "Protein" },
  { name: "Beef (Lean)", cal: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, category: "Protein" },
  { name: "Pork", cal: 297, protein: 27, carbs: 0, fat: 20, fiber: 0, category: "Protein" },
  { name: "Salmon", cal: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, category: "Protein" },
  { name: "Mackerel (Bangda)", cal: 205, protein: 19, carbs: 0, fat: 14, fiber: 0, category: "Protein" },
  { name: "Pomfret", cal: 150, protein: 22, carbs: 0, fat: 7, fiber: 0, category: "Protein" },
  { name: "Surmai (Kingfish)", cal: 120, protein: 24, carbs: 0, fat: 3, fiber: 0, category: "Protein" },
  { name: "Prawns (Shrimp)", cal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, category: "Protein" },
  { name: "Crab", cal: 83, protein: 18, carbs: 0, fat: 1.5, fiber: 0, category: "Protein" },
  { name: "Squid", cal: 92, protein: 16, carbs: 3, fat: 1.4, fiber: 0, category: "Protein" },
  { name: "Eggs (whole)", cal: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, category: "Protein" },
  { name: "Egg Whites", cal: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, category: "Protein" },

  // Dairy & Paneer
  { name: "Paneer", cal: 265, protein: 18, carbs: 3.4, fat: 20, fiber: 0, category: "Protein" },
  { name: "Greek Yogurt", cal: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, category: "Protein" },
  { name: "Cottage Cheese", cal: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, category: "Protein" },
  { name: "Whole Milk", cal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, category: "Protein" },
  { name: "Buffalo Milk", cal: 97, protein: 4.3, carbs: 5.2, fat: 6.5, fiber: 0, category: "Protein" },
  { name: "Butter", cal: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, category: "Fats" },
  { name: "Ghee", cal: 112, protein: 0, carbs: 0, fat: 12.7, fiber: 0, category: "Fats" },

  // Plant Proteins
  { name: "Tofu", cal: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, category: "Protein" },
  { name: "Lentils (Masoor Dal)", cal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, category: "Protein" },
  { name: "Toor Dal", cal: 120, protein: 8.5, carbs: 21, fat: 0.7, fiber: 6, category: "Protein" },
  { name: "Moong Dal", cal: 105, protein: 7, carbs: 19, fat: 0.4, fiber: 7.6, category: "Protein" },
  { name: "Chana Dal", cal: 160, protein: 9, carbs: 27, fat: 2.5, fiber: 7, category: "Protein" },
  { name: "Chickpeas (Kabuli Chana)", cal: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, category: "Protein" },
  { name: "Rajma (Kidney Beans)", cal: 127, protein: 8.7, carbs: 22, fat: 0.5, fiber: 6.4, category: "Protein" },
  { name: "Soybeans", cal: 173, protein: 16.6, carbs: 9.9, fat: 9, fiber: 6, category: "Protein" },

  // Grains & Carbs
  { name: "White Rice", cal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, category: "Carbs" },
  { name: "Brown Rice", cal: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, category: "Carbs" },
  { name: "Jowar (Sorghum)", cal: 329, protein: 11, carbs: 70, fat: 3.5, fiber: 10, category: "Carbs" },
  { name: "Bajra (Pearl Millet)", cal: 361, protein: 12, carbs: 67, fat: 5, fiber: 11, category: "Carbs" },
  { name: "Ragi (Finger Millet)", cal: 328, protein: 7.3, carbs: 72, fat: 1.3, fiber: 3.6, category: "Carbs" },
  { name: "Wheat Flour (Atta)", cal: 340, protein: 13, carbs: 72, fat: 2.5, fiber: 12, category: "Carbs" },
  { name: "Oats", cal: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6, category: "Carbs" },
  { name: "Quinoa", cal: 368, protein: 14, carbs: 64, fat: 6, fiber: 7, category: "Carbs" },
  { name: "Sweet Potato", cal: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, category: "Carbs" },
  // Fruits (Common)
  { name: "Banana", cal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, category: "Fruits" },
  { name: "Mango", cal: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, category: "Fruits" },
  { name: "Apple", cal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, category: "Fruits" },
  { name: "Guava", cal: 68, protein: 2.6, carbs: 14, fat: 1, fiber: 5.4, category: "Fruits" },
  { name: "Papaya", cal: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7, category: "Fruits" },
  { name: "Orange", cal: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, category: "Fruits" },
  { name: "Pineapple", cal: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, category: "Fruits" },
  { name: "Pomegranate", cal: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4, category: "Fruits" },
  { name: "Grapes", cal: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, category: "Fruits" },
  { name: "Watermelon", cal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, category: "Fruits" },

  // Vegetables (Very Common in Indian Homes)
  { name: "Tomato", cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, category: "Vegetables" },
  { name: "Onion", cal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, category: "Vegetables" },
  { name: "Potato", cal: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, category: "Vegetables" },
  { name: "Brinjal (Eggplant)", cal: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3, category: "Vegetables" },
  { name: "Ladyfinger (Okra)", cal: 33, protein: 2, carbs: 7.5, fat: 0.2, fiber: 3.2, category: "Vegetables" },
  { name: "Bitter Gourd (Karela)", cal: 17, protein: 1, carbs: 3.5, fat: 0.2, fiber: 2.5, category: "Vegetables" },
  { name: "Bottle Gourd (Lauki)", cal: 15, protein: 0.6, carbs: 3.4, fat: 0.1, fiber: 0.5, category: "Vegetables" },
  { name: "Ridge Gourd", cal: 20, protein: 1.2, carbs: 4, fat: 0.2, fiber: 1.8, category: "Vegetables" },
  { name: "Cauliflower", cal: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, category: "Vegetables" },
  { name: "Cabbage", cal: 25, protein: 1.3, carbs: 5.8, fat: 0.1, fiber: 2.5, category: "Vegetables" },
  { name: "Spinach (Palak)", cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, category: "Vegetables" },
  { name: "Fenugreek Leaves (Methi)", cal: 49, protein: 4.4, carbs: 6, fat: 0.9, fiber: 4.9, category: "Vegetables" },
  { name: "Broccoli", cal: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, category: "Vegetables" },
  { name: "Carrot", cal: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, category: "Vegetables" },
  { name: "Capsicum (Bell Pepper)", cal: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, category: "Vegetables" },
  { name: "Green Peas", cal: 81, protein: 5.4, carbs: 14.5, fat: 0.4, fiber: 5.7, category: "Vegetables" },

  // More Raw Ingredients (Nuts, Seeds, Oils, Spices, etc.)
  { name: "Almonds", cal: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, category: "Fats" },
  { name: "Cashew Nuts", cal: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3, category: "Fats" },
  { name: "Peanuts", cal: 567, protein: 26, carbs: 16, fat: 49, fiber: 9, category: "Fats" },
  { name: "Walnuts", cal: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, category: "Fats" },
  { name: "Chia Seeds", cal: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, category: "Fats" },
  { name: "Flax Seeds", cal: 534, protein: 18, carbs: 29, fat: 42, fiber: 27, category: "Fats" },
  { name: "Olive Oil", cal: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0, category: "Fats" },
  { name: "Coconut Oil", cal: 117, protein: 0, carbs: 0, fat: 13, fiber: 0, category: "Fats" },
  { name: "Mustard Oil", cal: 124, protein: 0, carbs: 0, fat: 14, fiber: 0, category: "Fats" },

  // Spices & Herbs (per 100g)
  { name: "Turmeric Powder", cal: 312, protein: 9.7, carbs: 67, fat: 3.3, fiber: 22, category: "Spices" },
  { name: "Cumin Seeds", cal: 375, protein: 18, carbs: 44, fat: 22, fiber: 11, category: "Spices" },
  { name: "Coriander Powder", cal: 282, protein: 12, carbs: 55, fat: 18, fiber: 29, category: "Spices" },
  { name: "Red Chilli Powder", cal: 282, protein: 12, carbs: 55, fat: 14, fiber: 28, category: "Spices" },
  { name: "Ginger", cal: 80, protein: 1.8, carbs: 18, fat: 0.8, fiber: 2, category: "Vegetables" },
  { name: "Garlic", cal: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, category: "Vegetables" },

  // More common items (to reach ~500 total)
  { name: "Coconut (fresh)", cal: 354, protein: 3.3, carbs: 15, fat: 33, fiber: 9, category: "Fats" },
  { name: "Coconut (grated)", cal: 354, protein: 3.3, carbs: 15, fat: 33, fiber: 9, category: "Fats" },
  { name: "Lemon", cal: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, category: "Fruits" },
  { name: "Green Chilli", cal: 40, protein: 2, carbs: 9, fat: 0.4, fiber: 1.5, category: "Vegetables" },

  // More Seafood (Popular in Catholic homes)
  { name: "Bombay Duck (Bombil)", cal: 90, protein: 18, carbs: 0, fat: 2, fiber: 0, category: "Protein" },
  { name: "Rawas (Indian Salmon)", cal: 140, protein: 22, carbs: 0, fat: 6, fiber: 0, category: "Protein" },
  { name: "Tilapia", cal: 96, protein: 20, carbs: 0, fat: 2, fiber: 0, category: "Protein" },
  { name: "Clams", cal: 86, protein: 15, carbs: 3, fat: 1, fiber: 0, category: "Protein" },
  { name: "Mussels", cal: 86, protein: 12, carbs: 4, fat: 2, fiber: 0, category: "Protein" },
  { name: "Oysters", cal: 81, protein: 9, carbs: 5, fat: 3, fiber: 0, category: "Protein" },

  // More Meats & Offal
  { name: "Chicken Wings", cal: 203, protein: 19, carbs: 0, fat: 14, fiber: 0, category: "Protein" },
  { name: "Chicken Drumstick", cal: 161, protein: 24, carbs: 0, fat: 7, fiber: 0, category: "Protein" },
  { name: "Goat Liver", cal: 165, protein: 24, carbs: 0, fat: 6, fiber: 0, category: "Protein" },
  { name: "Beef Liver", cal: 135, protein: 20, carbs: 4, fat: 4, fiber: 0, category: "Protein" },

  // More Dals & Legumes
  { name: "Urad Dal (Black Gram)", cal: 341, protein: 25, carbs: 59, fat: 1.5, fiber: 18, category: "Protein" },
  { name: "Masoor Dal (Red Lentils)", cal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, category: "Protein" },
  { name: "Black Eyed Peas (Chawli)", cal: 116, protein: 8, carbs: 20, fat: 0.5, fiber: 6, category: "Protein" },
  { name: "Green Gram (Whole Moong)", cal: 347, protein: 24, carbs: 63, fat: 1.2, fiber: 16, category: "Protein" },
  { name: "Horse Gram (Kulith)", cal: 321, protein: 22, carbs: 57, fat: 2, fiber: 5, category: "Protein" },

  // More Grains & Flours
  { name: "Maize Flour (Makai Atta)", cal: 362, protein: 8.1, carbs: 77, fat: 3.6, fiber: 7, category: "Carbs" },
  { name: "Barley", cal: 354, protein: 12, carbs: 73, fat: 2.3, fiber: 17, category: "Carbs" },
  { name: "Amaranth Seeds", cal: 371, protein: 14, carbs: 66, fat: 7, fiber: 7, category: "Carbs" },
  { name: "Sago (Sabudana)", cal: 358, protein: 0.2, carbs: 88, fat: 0.1, fiber: 0.5, category: "Carbs" },
  { name: "Rice Flour", cal: 366, protein: 6, carbs: 80, fat: 1.5, fiber: 2.4, category: "Carbs" },

  // More Vegetables
  { name: "Cluster Beans (Gavar)", cal: 47, protein: 3.2, carbs: 10.8, fat: 0.4, fiber: 5.2, category: "Vegetables" },
  { name: "Drumstick Leaves", cal: 64, protein: 9.4, carbs: 8.3, fat: 1.4, fiber: 2, category: "Vegetables" },
  { name: "Colocasia Leaves (Arbi Patta)", cal: 42, protein: 3.9, carbs: 6.7, fat: 0.7, fiber: 3.8, category: "Vegetables" },
  { name: "Yam (Suran)", cal: 118, protein: 1.5, carbs: 28, fat: 0.2, fiber: 4.1, category: "Vegetables" },
  { name: "Taro Root (Arbi)", cal: 112, protein: 1.5, carbs: 26, fat: 0.2, fiber: 5.1, category: "Vegetables" },
  { name: "Ash Gourd (Petha)", cal: 13, protein: 0.4, carbs: 3, fat: 0.1, fiber: 0.5, category: "Vegetables" },
  { name: "Snake Gourd", cal: 18, protein: 0.9, carbs: 3.8, fat: 0.1, fiber: 1.2, category: "Vegetables" },
  { name: "Pointed Gourd (Parwal)", cal: 20, protein: 1.2, carbs: 4, fat: 0.3, fiber: 1.5, category: "Vegetables" },
  { name: "Beet Greens", cal: 22, protein: 2.2, carbs: 4.3, fat: 0.1, fiber: 3.7, category: "Vegetables" },
  { name: "Mint Leaves", cal: 70, protein: 3.8, carbs: 14.9, fat: 0.7, fiber: 8, category: "Vegetables" },
  { name: "Coriander Leaves", cal: 23, protein: 2.1, carbs: 3.7, fat: 0.5, fiber: 2.8, category: "Vegetables" },

  // More Fruits
  { name: "Sapota (Chikoo)", cal: 83, protein: 0.4, carbs: 20, fat: 1.1, fiber: 5.3, category: "Fruits" },
  { name: "Custard Apple (Sitaphal)", cal: 94, protein: 2.1, carbs: 23.6, fat: 0.3, fiber: 4.6, category: "Fruits" },
  { name: "Jackfruit (Raw)", cal: 95, protein: 1.7, carbs: 23, fat: 0.6, fiber: 1.5, category: "Fruits" },
  { name: "Lychee", cal: 66, protein: 0.8, carbs: 16.5, fat: 0.4, fiber: 1.3, category: "Fruits" },
  { name: "Kiwi", cal: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3, category: "Fruits" },
  { name: "Pear", cal: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1, category: "Fruits" },

  // More Nuts & Seeds
  { name: "Pistachios", cal: 562, protein: 20, carbs: 27, fat: 45, fiber: 10, category: "Fats" },
  { name: "Pumpkin Seeds", cal: 559, protein: 30, carbs: 11, fat: 49, fiber: 6, category: "Fats" },
  { name: "Sesame Seeds", cal: 573, protein: 18, carbs: 23, fat: 50, fiber: 12, category: "Fats" },
  { name: "Sunflower Seeds", cal: 584, protein: 21, carbs: 20, fat: 50, fiber: 9, category: "Fats" },

  // More Spices & Condiments (per 100g)
  { name: "Black Pepper", cal: 255, protein: 10, carbs: 64, fat: 3, fiber: 25, category: "Spices" },
  { name: "Cardamom", cal: 311, protein: 11, carbs: 68, fat: 7, fiber: 28, category: "Spices" },
  { name: "Cloves", cal: 274, protein: 6, carbs: 66, fat: 13, fiber: 34, category: "Spices" },
  { name: "Cinnamon", cal: 247, protein: 4, carbs: 81, fat: 1.2, fiber: 53, category: "Spices" },
  { name: "Fenugreek Seeds", cal: 323, protein: 23, carbs: 58, fat: 7, fiber: 25, category: "Spices" },
  { name: "Mustard Seeds", cal: 508, protein: 26, carbs: 28, fat: 36, fiber: 12, category: "Spices" },

  // Other Common Raw Items
  { name: "Coconut Water", cal: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, category: "Fruits" },
  { name: "Tamarind Pulp", cal: 239, protein: 2.8, carbs: 62.5, fat: 0.6, fiber: 5.1, category: "Fruits" },
  { name: "Jaggery", cal: 383, protein: 0.4, carbs: 98, fat: 0.1, fiber: 0, category: "Carbs" },
  { name: "Honey", cal: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, category: "Carbs" },
  { name: "Sugar", cal: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, category: "Carbs" },
  { name: "Rock Salt", cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, category: "Spices" },
  { name: "Curry Leaves", cal: 108, protein: 6, carbs: 18, fat: 1, fiber: 8, category: "Vegetables" },
];


const CATEGORIES = ["All", "Protein", "Carbs", "Fats", "Vegetables"];
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks", "Pre-Workout", "Post-Workout"];

function scaleNutrition(food, grams) {
  const f = grams / 100;
  return {
    cal: Math.round(food.cal * f),
    protein: Math.round(food.protein * f * 10) / 10,
    carbs: Math.round(food.carbs * f * 10) / 10,
    fat: Math.round(food.fat * f * 10) / 10,
    fiber: Math.round(food.fiber * f * 10) / 10,
  };
}

function sumNutrition(items) {
  return items.reduce((acc, item) => {
    const s = scaleNutrition(item.food, item.grams);
    return {
      cal: acc.cal + s.cal,
      protein: Math.round((acc.protein + s.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + s.carbs) * 10) / 10,
      fat: Math.round((acc.fat + s.fat) * 10) / 10,
      fiber: Math.round((acc.fiber + s.fiber) * 10) / 10,
    };
  }, { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
}

export default function Nutrition() {
  const [userData, setUserData] = useState(null);
  const [todayLog, setTodayLog] = useState([]);
  const [pastLogs, setPastLogs] = useState([]);
  const [savedDishes, setSavedDishes] = useState([]);
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'dishes'
  const [expandedDay, setExpandedDay] = useState(null);

  // Log food modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logSource, setLogSource] = useState('food'); // 'food' | 'dish'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [grams, setGrams] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [saving, setSaving] = useState(false);

  // Dish builder modal
  const [showDishModal, setShowDishModal] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishIngredients, setDishIngredients] = useState([]);
  const [dishSearch, setDishSearch] = useState('');
  const [dishCatFilter, setDishCatFilter] = useState('All');
  const [savingDish, setSavingDish] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) setUserData(userSnap.data());

      try {
        const q = query(collection(db, "nutrition"), where("userId", "==", uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTodayLog(logs.filter(l => l.date === today));
        setPastLogs(logs.filter(l => l.date !== today));
      } catch (err) { console.error(err); }

      try {
        const dq = query(collection(db, "dishes"), where("userId", "==", uid), orderBy("createdAt", "desc"));
        const dsnap = await getDocs(dq);
        setSavedDishes(dsnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const totals = todayLog.reduce((acc, e) => ({
    cal: acc.cal + (e.cal || 0),
    protein: Math.round((acc.protein + (e.protein || 0)) * 10) / 10,
    carbs: Math.round((acc.carbs + (e.carbs || 0)) * 10) / 10,
    fat: Math.round((acc.fat + (e.fat || 0)) * 10) / 10,
    fiber: Math.round((acc.fiber + (e.fiber || 0)) * 10) / 10,
  }), { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const calorieGoal = userData?.calorieGoal || 2500;
  const proteinGoal = userData?.proteinGoal || Math.round(calorieGoal * 0.3 / 4);
  const carbsGoal = userData?.carbsGoal || Math.round(calorieGoal * 0.4 / 4);
  const fatGoal = userData?.fatGoal || Math.round(calorieGoal * 0.3 / 9);
  const calPct = Math.min((totals.cal / calorieGoal) * 100, 100);

  const filteredFoods = FOOD_DB.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (categoryFilter === 'All' || f.category === categoryFilter)
  );

  const dishFilteredFoods = FOOD_DB.filter(f =>
    f.name.toLowerCase().includes(dishSearch.toLowerCase()) &&
    (dishCatFilter === 'All' || f.category === dishCatFilter)
  );

  // Log a raw food item
  const logFood = async () => {
    if (!selectedFood) return;
    setSaving(true);
    const scaled = scaleNutrition(selectedFood, grams);
    try {
      const entry = {
        userId: auth.currentUser.uid,
        date: today,
        meal: selectedMeal,
        foodName: selectedFood.name,
        grams,
        ...scaled,
        category: selectedFood.category,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "nutrition"), entry);
      setTodayLog(prev => [{ ...entry, id: ref.id }, ...prev]);
      setShowLogModal(false);
      setSelectedFood(null);
      setGrams(100);
    } catch (err) { alert("Failed: " + err.message); }
    finally { setSaving(false); }
  };

  // Log a saved dish
  const logDish = async () => {
    if (!selectedDish) return;
    setSaving(true);
    const nutrition = sumNutrition(selectedDish.ingredients);
    try {
      const entry = {
        userId: auth.currentUser.uid,
        date: today,
        meal: selectedMeal,
        foodName: selectedDish.name,
        grams: selectedDish.ingredients.reduce((t, i) => t + i.grams, 0),
        isDish: true,
        ...nutrition,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "nutrition"), entry);
      setTodayLog(prev => [{ ...entry, id: ref.id }, ...prev]);
      setShowLogModal(false);
      setSelectedDish(null);
    } catch (err) { alert("Failed: " + err.message); }
    finally { setSaving(false); }
  };

  // Save a dish
  const saveDish = async () => {
    if (!dishName.trim() || dishIngredients.length === 0) return;
    setSavingDish(true);
    try {
      const dish = {
        userId: auth.currentUser.uid,
        name: dishName.trim(),
        ingredients: dishIngredients,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "dishes"), dish);
      setSavedDishes(prev => [{ ...dish, id: ref.id }, ...prev]);
      setShowDishModal(false);
      setDishName('');
      setDishIngredients([]);
    } catch (err) { alert("Failed: " + err.message); }
    finally { setSavingDish(false); }
  };

  const deleteDish = async (id) => {
    await deleteDoc(doc(db, "dishes", id));
    setSavedDishes(prev => prev.filter(d => d.id !== id));
  };

  const addIngredientToDish = (food) => {
    setDishIngredients(prev => {
      const exists = prev.find(i => i.food.name === food.name);
      if (exists) return prev;
      return [...prev, { food, grams: 100 }];
    });
  };

  const updateIngredientGrams = (idx, val) => {
    setDishIngredients(prev => {
      const updated = [...prev];
      updated[idx].grams = parseFloat(val) || 0;
      return updated;
    });
  };

  const groupedByMeal = MEALS.reduce((acc, meal) => {
    acc[meal] = todayLog.filter(e => e.meal === meal);
    return acc;
  }, {});

  const pastByDate = pastLogs.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const dishNutritionPreview = dishIngredients.length > 0 ? sumNutrition(dishIngredients) : null;

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white">Nutrition</h1>
            <p className="text-zinc-400 mt-1">Track every macro. Fuel your ascent.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowDishModal(true)}
              className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2.5 rounded-2xl font-medium flex items-center gap-2 border border-zinc-700 text-sm">
              <UtensilsCrossed size={16} /> Build Dish
            </button>
            <button onClick={() => setShowLogModal(true)}
              className="bg-orange-500 hover:bg-orange-600 transition px-5 py-2.5 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 text-sm">
              <Plus size={18} /> Log Food
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{ key: 'log', label: 'Today\'s Log' }, { key: 'dishes', label: 'My Dishes' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-6 py-2.5 rounded-2xl font-medium transition ${activeTab === t.key ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'log' && (
          <>
            {/* Calorie Ring + Macros */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-8 mb-6">
              <p className="text-zinc-500 text-sm uppercase tracking-widest mb-6">Today — {today}</p>
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="relative w-44 h-44 flex-shrink-0">
                  <svg className="w-44 h-44 -rotate-90" viewBox="0 0 176 176">
                    <circle cx="88" cy="88" r="72" fill="none" stroke="#27272a" strokeWidth="14" />
                    <circle cx="88" cy="88" r="72" fill="none" stroke="#f97316" strokeWidth="14"
                      strokeDasharray={`${2 * Math.PI * 72}`}
                      strokeDashoffset={`${2 * Math.PI * 72 * (1 - calPct / 100)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-white">{totals.cal}</p>
                    <p className="text-xs text-zinc-500">/ {calorieGoal} kcal</p>
                    <p className="text-xs text-zinc-600 mt-1">{Math.max(0, calorieGoal - totals.cal)} left</p>
                  </div>
                </div>
                <div className="flex-1 w-full space-y-5">
                  {[
                    { label: "Protein", val: totals.protein, goal: proteinGoal, color: "bg-blue-500" },
                    { label: "Carbohydrates", val: totals.carbs, goal: carbsGoal, color: "bg-green-500" },
                    { label: "Fat", val: totals.fat, goal: fatGoal, color: "bg-yellow-500" },
                    { label: "Fiber", val: totals.fiber, goal: 30, color: "bg-purple-500" },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">{m.label}</span>
                        <span className="text-white">{m.val}g <span className="text-zinc-500">/ {m.goal}g</span></span>
                      </div>
                      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-2.5 ${m.color} rounded-full transition-all`}
                          style={{ width: `${Math.min((m.val / m.goal) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today's Meals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-8 mb-6">
              <h3 className="text-lg font-semibold mb-6">Today's Meals</h3>
              {todayLog.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-700 rounded-2xl">
                  Nothing logged yet. Hit "Log Food" to start.
                </div>
              ) : (
                <div className="space-y-4">
                  {MEALS.map(meal => {
                    const entries = groupedByMeal[meal];
                    if (!entries.length) return null;
                    const mealCals = entries.reduce((t, e) => t + e.cal, 0);
                    return (
                      <div key={meal} className="bg-zinc-800 rounded-2xl overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4">
                          <p className="font-semibold text-white">{meal}</p>
                          <p className="text-orange-500 text-sm font-medium">{mealCals} kcal</p>
                        </div>
                        <div className="px-5 pb-4 space-y-2">
                          {entries.map((e, i) => (
                            <div key={i} className="flex justify-between items-center text-sm bg-zinc-700/50 rounded-xl px-4 py-2">
                              <span className="text-white">
                                {e.foodName}
                                {e.isDish ? <span className="text-orange-400 text-xs ml-2">[dish]</span> : <span className="text-zinc-400"> ({e.grams}g)</span>}
                              </span>
                              <div className="flex gap-4 text-zinc-400">
                                <span>{e.cal} kcal</span>
                                <span className="text-blue-400 hidden sm:inline">P:{e.protein}g</span>
                                <span className="text-green-400 hidden sm:inline">C:{e.carbs}g</span>
                                <span className="text-yellow-400 hidden sm:inline">F:{e.fat}g</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past Days */}
            {Object.keys(pastByDate).length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-8">
                <h3 className="text-lg font-semibold mb-6">Past Days</h3>
                <div className="space-y-3">
                  {Object.entries(pastByDate).map(([date, entries]) => {
                    const dayCals = entries.reduce((t, e) => t + e.cal, 0);
                    const dayProtein = entries.reduce((t, e) => t + e.protein, 0);
                    return (
                      <div key={date} className="bg-zinc-800 rounded-2xl overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-zinc-700/50 transition"
                          onClick={() => setExpandedDay(expandedDay === date ? null : date)}>
                          <p className="font-medium text-white">{date}</p>
                          <div className="flex items-center gap-6">
                            <span className="text-orange-500 text-sm">{dayCals} kcal</span>
                            <span className="text-blue-400 text-sm">P: {Math.round(dayProtein)}g</span>
                            {expandedDay === date ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                          </div>
                        </div>
                        {expandedDay === date && (
                          <div className="px-5 pb-4 space-y-2 border-t border-zinc-700 pt-3">
                            {entries.map((e, i) => (
                              <div key={i} className="flex justify-between text-sm bg-zinc-700/50 rounded-xl px-4 py-2">
                                <span className="text-white">{e.foodName} <span className="text-zinc-400">· {e.meal}</span></span>
                                <span className="text-zinc-400 text-xs md:text-sm">{e.cal} kcal</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'dishes' && (
          <div className="space-y-4">
            {savedDishes.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-zinc-700 rounded-3xl text-zinc-500">
                No dishes saved yet. Hit "Build Dish" to create one.
              </div>
            ) : (
              savedDishes.map(dish => {
                const nutrition = sumNutrition(dish.ingredients);
                return (
                  <div key={dish.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xl font-bold text-white">{dish.name}</p>
                        <p className="text-zinc-500 text-sm mt-1">{dish.ingredients.length} ingredients</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setSelectedDish(dish); setLogSource('dish'); setShowLogModal(true); }}
                          className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-2xl text-sm font-medium">
                          Log This
                        </button>
                        <button onClick={() => deleteDish(dish.id)} className="text-red-400 hover:text-red-300 p-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Nutrition summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "Calories", val: nutrition.cal, color: "text-orange-500" },
                        { label: "Protein", val: `${nutrition.protein}g`, color: "text-blue-400" },
                        { label: "Carbs", val: `${nutrition.carbs}g`, color: "text-green-400" },
                        { label: "Fat", val: `${nutrition.fat}g`, color: "text-yellow-400" },
                      ].map(n => (
                        <div key={n.label} className="bg-zinc-800 rounded-2xl p-3 text-center">
                          <p className={`text-lg font-bold ${n.color}`}>{n.val}</p>
                          <p className="text-xs text-zinc-500 mt-1">{n.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Ingredients */}
                    <div className="flex flex-wrap gap-2">
                      {dish.ingredients.map((ing, i) => (
                        <span key={i} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">
                          {ing.food.name} · {ing.grams}g
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* LOG FOOD MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-zinc-900 w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Log Food</h3>
              <button onClick={() => { setShowLogModal(false); setSelectedFood(null); setSelectedDish(null); }}>
                <X size={22} className="text-zinc-400 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Source toggle */}
              <div className="flex gap-2">
                {[{ key: 'food', label: 'Ingredients' }, { key: 'dish', label: 'My Dishes' }].map(s => (
                  <button key={s.key} onClick={() => { setLogSource(s.key); setSelectedFood(null); setSelectedDish(null); }}
                    className={`px-5 py-2 rounded-2xl text-sm font-medium transition ${logSource === s.key ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Meal selector */}
              <div className="flex gap-2 flex-wrap">
                {MEALS.map(m => (
                  <button key={m} onClick={() => setSelectedMeal(m)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${selectedMeal === m ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    {m}
                  </button>
                ))}
              </div>

              {logSource === 'food' && (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                      <input type="text" placeholder="Search foods..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-9 p-3 text-white" />
                    </div>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-white text-sm">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-auto">
                    {filteredFoods.map(food => (
                      <div key={food.name} onClick={() => setSelectedFood(food)}
                        className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition ${selectedFood?.name === food.name ? 'bg-orange-500/20 border border-orange-500' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                        <div>
                          <p className="font-medium text-white">{food.name}</p>
                          <p className="text-xs text-zinc-500">per 100g · {food.category}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-orange-500 font-semibold">{food.cal} kcal</p>
                          <p className="text-zinc-500">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedFood && (
                    <div className="bg-zinc-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <p className="text-white font-medium flex-1">{selectedFood.name}</p>
                        <input type="number" value={grams} min={1}
                          onChange={e => setGrams(parseFloat(e.target.value) || 100)}
                          className="w-24 bg-zinc-700 border border-zinc-600 rounded-xl p-2 text-center text-white" />
                        <span className="text-zinc-400 text-sm">g</span>
                      </div>
                      {(() => {
                        const s = scaleNutrition(selectedFood, grams);
                        return (
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              { label: "Cal", val: s.cal, color: "text-orange-500" },
                              { label: "Protein", val: `${s.protein}g`, color: "text-blue-400" },
                              { label: "Carbs", val: `${s.carbs}g`, color: "text-green-400" },
                              { label: "Fat", val: `${s.fat}g`, color: "text-yellow-400" },
                            ].map(n => (
                              <div key={n.label} className="bg-zinc-700 rounded-xl p-2">
                                <p className={`font-bold ${n.color}`}>{n.val}</p>
                                <p className="text-xs text-zinc-500">{n.label}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              {logSource === 'dish' && (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {savedDishes.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No dishes saved yet. Build one first.</p>
                  ) : (
                    savedDishes.map(dish => {
                      const n = sumNutrition(dish.ingredients);
                      return (
                        <div key={dish.id} onClick={() => setSelectedDish(dish)}
                          className={`p-4 rounded-2xl cursor-pointer transition ${selectedDish?.id === dish.id ? 'bg-orange-500/20 border border-orange-500' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-white">{dish.name}</p>
                            <p className="text-orange-500 font-semibold text-sm">{n.cal} kcal</p>
                          </div>
                          <p className="text-zinc-500 text-xs mt-1">P:{n.protein}g · C:{n.carbs}g · F:{n.fat}g · {dish.ingredients.length} ingredients</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => { setShowLogModal(false); setSelectedFood(null); setSelectedDish(null); }}
                className="px-6 py-3 text-zinc-400 hover:text-white">Cancel</button>
              <button
                onClick={logSource === 'food' ? logFood : logDish}
                disabled={(logSource === 'food' ? !selectedFood : !selectedDish) || saving}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 px-8 py-3 rounded-2xl font-semibold flex items-center gap-2">
                <Save size={18} /> {saving ? "Saving..." : "Log"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISH BUILDER MODAL */}
      {showDishModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-zinc-900 w-full max-w-4xl rounded-3xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Build a Dish</h3>
              <button onClick={() => setShowDishModal(false)}>
                <X size={22} className="text-zinc-400 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: ingredient picker */}
                <div className="space-y-4">
                  <input type="text" placeholder="Dish name (e.g. Chicken Biryani)"
                    value={dishName} onChange={e => setDishName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-white" />

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                      <input type="text" placeholder="Search ingredients..." value={dishSearch}
                        onChange={e => setDishSearch(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-9 p-3 text-white" />
                    </div>
                    <select value={dishCatFilter} onChange={e => setDishCatFilter(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-white text-sm">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-auto">
                    {dishFilteredFoods.map(food => (
                      <div key={food.name}
                        onClick={() => addIngredientToDish(food)}
                        className={`flex justify-between items-center p-3 rounded-2xl cursor-pointer transition ${dishIngredients.find(i => i.food.name === food.name) ? 'bg-orange-500/10 border border-orange-500/40' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                        <p className="text-white text-sm">{food.name}</p>
                        <p className="text-zinc-500 text-xs">{food.cal} kcal/100g</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: ingredient list + nutrition preview */}
                <div className="space-y-4">
                  <p className="text-zinc-500 text-sm uppercase tracking-wider">Added Ingredients</p>

                  {dishIngredients.length === 0 ? (
                    <div className="text-center py-12 text-zinc-600 border border-dashed border-zinc-700 rounded-2xl text-sm">
                      Click ingredients on the left to add them
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-auto">
                      {dishIngredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3">
                          <p className="text-white text-sm flex-1">{ing.food.name}</p>
                          <input type="number" value={ing.grams} min={1}
                            onChange={e => updateIngredientGrams(i, e.target.value)}
                            className="w-20 bg-zinc-700 rounded-xl p-2 text-center text-white text-sm" />
                          <span className="text-zinc-500 text-xs">g</span>
                          <button onClick={() => setDishIngredients(prev => prev.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {dishNutritionPreview && (
                    <div className="bg-zinc-800 rounded-2xl p-4">
                      <p className="text-zinc-500 text-xs uppercase mb-3">Total Nutrition</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Calories", val: dishNutritionPreview.cal, color: "text-orange-500" },
                          { label: "Protein", val: `${dishNutritionPreview.protein}g`, color: "text-blue-400" },
                          { label: "Carbs", val: `${dishNutritionPreview.carbs}g`, color: "text-green-400" },
                          { label: "Fat", val: `${dishNutritionPreview.fat}g`, color: "text-yellow-400" },
                        ].map(n => (
                          <div key={n.label} className="bg-zinc-700 rounded-xl p-3 text-center">
                            <p className={`text-lg font-bold ${n.color}`}>{n.val}</p>
                            <p className="text-xs text-zinc-500">{n.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setShowDishModal(false)} className="px-6 py-3 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={saveDish} disabled={!dishName.trim() || dishIngredients.length === 0 || savingDish}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 px-8 py-3 rounded-2xl font-semibold flex items-center gap-2">
                <Save size={18} /> {savingDish ? "Saving..." : "Save Dish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}