import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  subject: string;
  answer: string;
}

const DEMO_QUESTIONS: QuizQuestion[] = [
  {
    question: "What is the SI unit of force?",
    options: ["Joule", "Newton", "Watt", "Pascal"],
    answerIndex: 1,
    subject: "Physics",
    answer: "Newton",
  },
  {
    question: "Which gas is most abundant in Earth's atmosphere?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    answerIndex: 2,
    subject: "Chemistry",
    answer: "Nitrogen",
  },
  {
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    answerIndex: 2,
    subject: "Biology",
    answer: "Mitochondria",
  },
  {
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2"],
    answerIndex: 1,
    subject: "Mathematics",
    answer: "2x",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Jupiter", "Mars", "Saturn"],
    answerIndex: 2,
    subject: "Physics",
    answer: "Mars",
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answerIndex: 2,
    subject: "Chemistry",
    answer: "Au",
  },
  {
    question: "What is the mirror formula for spherical mirrors?",
    options: ["1/f = 1/u + 1/v", "1/f = 1/u - 1/v", "f = u + v", "f = uv/(u+v)"],
    answerIndex: 0,
    subject: "Physics",
    answer: "1/f = 1/u + 1/v",
  },
  {
    question: "Which of the following is a scalar quantity?",
    options: ["Velocity", "Acceleration", "Speed", "Force"],
    answerIndex: 2,
    subject: "Physics",
    answer: "Speed",
  },
  {
    question: "What is the molecular formula of glucose?",
    options: ["C6H12O6", "C12H22O11", "CH4", "C2H6O"],
    answerIndex: 0,
    subject: "Chemistry",
    answer: "C6H12O6",
  },
  {
    question: "Who is known as the father of Biology?",
    options: ["Aristotle", "Theophrastus", "Darwin", "Lamark"],
    answerIndex: 0,
    subject: "Biology",
    answer: "Aristotle",
  },
  {
    question: "What is the value of sin(90°)?",
    options: ["0", "1", "√2/2", "√3/2"],
    answerIndex: 1,
    subject: "Mathematics",
    answer: "1",
  },
  {
    question: "Which article of the Nepal Constitution guarantees equality?",
    options: ["Article 12", "Article 18", "Article 20", "Article 25"],
    answerIndex: 1,
    subject: "Loksewa",
    answer: "Article 18",
  },
  {
    question: "What is the largest planet in our solar system?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    answerIndex: 2,
    subject: "General Knowledge",
    answer: "Jupiter",
  },
  {
    question: "What is the chemical formula of water?",
    options: ["H2O", "CO2", "NaCl", "O2"],
    answerIndex: 0,
    subject: "Chemistry",
    answer: "H2O",
  },
  {
    question: "Which organ is responsible for pumping blood?",
    options: ["Lungs", "Liver", "Heart", "Kidneys"],
    answerIndex: 2,
    subject: "Biology",
    answer: "Heart",
  },
  {
    question: "What is the integral of 2x?",
    options: ["x²", "x² + C", "2x²", "x²/2"],
    answerIndex: 1,
    subject: "Mathematics",
    answer: "x² + C",
  },
  {
    question: "Speed of light in vacuum is approximately:",
    options: ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
    answerIndex: 1,
    subject: "Physics",
    answer: "3 × 10⁸ m/s",
  },
  {
    question: "Which gas is used in photosynthesis?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    answerIndex: 1,
    subject: "Biology",
    answer: "Carbon dioxide",
  },
  {
    question: "What is the atomic number of Carbon?",
    options: ["4", "6", "8", "12"],
    answerIndex: 1,
    subject: "Chemistry",
    answer: "6",
  },
  {
    question: "Who wrote the Constitution of Nepal 2072?",
    options: ["Constituent Assembly", "King", "Prime Minister", "Supreme Court"],
    answerIndex: 0,
    subject: "Loksewa",
    answer: "Constituent Assembly",
  },
  {
    question: "Which is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    answerIndex: 1,
    subject: "General Knowledge",
    answer: "Vatican City",
  },
  {
    question: "What is the pH of pure water?",
    options: ["0", "7", "14", "1"],
    answerIndex: 1,
    subject: "Chemistry",
    answer: "7",
  },
  {
    question: "Which vitamin is produced by the human body?",
    options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin E"],
    answerIndex: 2,
    subject: "Biology",
    answer: "Vitamin D",
  },
  {
    question: "What is the value of π (pi) approximately?",
    options: ["3.14", "2.14", "1.14", "4.14"],
    answerIndex: 0,
    subject: "Mathematics",
    answer: "3.14",
  },
  {
    question: "Newton's first law is also called:",
    options: ["Law of acceleration", "Law of inertia", "Law of action-reaction", "Law of gravitation"],
    answerIndex: 1,
    subject: "Physics",
    answer: "Law of inertia",
  },
  {
    question: "Which is the longest river in Nepal?",
    options: ["Koshi", "Gandaki", "Karnali", "Mahakali"],
    answerIndex: 0,
    subject: "General Knowledge",
    answer: "Koshi",
  },
  {
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    answerIndex: 2,
    subject: "Biology",
    answer: "Mitochondria",
  },
  {
    question: "Which of the following is an acid?",
    options: ["NaOH", "HCl", "KOH", "Ca(OH)₂"],
    answerIndex: 1,
    subject: "Chemistry",
    answer: "HCl",
  },
  {
    question: "What is the formula for area of a circle?",
    options: ["πr", "πr²", "2πr", "πd"],
    answerIndex: 1,
    subject: "Mathematics",
    answer: "πr²",
  },
  {
    question: "Who is the current President of Nepal (as of 2024)?",
    options: ["Bidhya Devi Bhandari", "Ram Chandra Poudel", "KP Sharma Oli", "Sher Bahadur Deuba"],
    answerIndex: 1,
    subject: "Loksewa",
    answer: "Ram Chandra Poudel",
  },
  {
    question: "Which is the highest mountain in the world?",
    options: ["K2", "Kanchenjunga", "Mount Everest", "Lhotse"],
    answerIndex: 2,
    subject: "General Knowledge",
    answer: "Mount Everest",
  },
  {
    question: "What is the unit of electric current?",
    options: ["Volt", "Ohm", "Ampere", "Watt"],
    answerIndex: 2,
    subject: "Physics",
    answer: "Ampere",
  },
  {
    question: "Which is the largest organ in the human body?",
    options: ["Heart", "Liver", "Skin", "Brain"],
    answerIndex: 2,
    subject: "Biology",
    answer: "Skin",
  },
  {
    question: "What is the atomic mass of Oxygen?",
    options: ["12", "14", "16", "18"],
    answerIndex: 2,
    subject: "Chemistry",
    answer: "16",
  },
  {
    question: "Who is the father of Mathematics?",
    options: ["Archimedes", "Aryabhatta", "Euclid", "Pythagoras"],
    answerIndex: 2,
    subject: "Mathematics",
    answer: "Euclid",
  },
  {
    question: "Which is the longest river in the world?",
    options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
    answerIndex: 1,
    subject: "General Knowledge",
    answer: "Nile",
  },
  {
    question: "What is the boiling point of water?",
    options: ["90°C", "100°C", "110°C", "120°C"],
    answerIndex: 1,
    subject: "Chemistry",
    answer: "100°C",
  },
  {
    question: "Which blood group is known as the universal donor?",
    options: ["A", "B", "AB", "O"],
    answerIndex: 3,
    subject: "Biology",
    answer: "O",
  },
  {
    question: "What is the value of cos(0°)?",
    options: ["0", "1", "√2/2", "√3/2"],
    answerIndex: 1,
    subject: "Mathematics",
    answer: "1",
  },
  {
    question: "Who discovered gravity?",
    options: ["Einstein", "Newton", "Galileo", "Copernicus"],
    answerIndex: 1,
    subject: "Physics",
    answer: "Newton",
  },
  {
    question: "Which is the largest ocean in the world?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answerIndex: 3,
    subject: "General Knowledge",
    answer: "Pacific",
  },
  {
    question: "What is the chemical formula of table salt?",
    options: ["NaCl", "KCl", "CaCl₂", "MgCl₂"],
    answerIndex: 0,
    subject: "Chemistry",
    answer: "NaCl",
  },
  {
    question: "Which part of the plant performs photosynthesis?",
    options: ["Root", "Stem", "Leaf", "Flower"],
    answerIndex: 2,
    subject: "Biology",
    answer: "Leaf",
  },
  {
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    answerIndex: 2,
    subject: "Mathematics",
    answer: "12",
  },
  {
    question: "Which is the smallest continent?",
    options: ["Europe", "Australia", "Antarctica", "South America"],
    answerIndex: 1,
    subject: "General Knowledge",
    answer: "Australia",
  },
  {
    question: "What is the unit of power?",
    options: ["Joule", "Watt", "Newton", "Pascal"],
    answerIndex: 1,
    subject: "Physics",
    answer: "Watt",
  },
  {
    question: "Which is the longest mountain range in the world?",
    options: ["Himalayas", "Andes", "Rocky Mountains", "Alps"],
    answerIndex: 1,
    subject: "General Knowledge",
    answer: "Andes",
  },
  {
    question: "What is the basic unit of life?",
    options: ["Tissue", "Organ", "Cell", "Organism"],
    answerIndex: 2,
    subject: "Biology",
    answer: "Cell",
  },
  {
    question: "Which of the following is a noble gas?",
    options: ["Oxygen", "Nitrogen", "Helium", "Hydrogen"],
    answerIndex: 2,
    subject: "Chemistry",
    answer: "Helium",
  },
  {
    question: "What is the value of log(1)?",
    options: ["0", "1", "10", "Undefined"],
    answerIndex: 0,
    subject: "Mathematics",
    answer: "0",
  },
];

/**
 * GET /api/quiz
 *
 * Returns the full question bank for the Question Recap. In a live
 * deployment this could be generated from content items; for now it
 * returns the curriculum-derived demo bank.
 */
export async function GET() {
  return NextResponse.json({ data: DEMO_QUESTIONS });
}
