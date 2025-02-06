import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface RepasItem {
  id: number;
  date: string;
  foods: string[];
  totalCalories: number;
}

const EDAMAM_API_ID = process.env.EXPO_PUBLIC_EDAMAM_API_ID;
const EDAMAM_API_KEY = process.env.EXPO_PUBLIC_EDAMAM_API_KEY;

export default function HomeScreen() {
  const router = useRouter();
  const [Repas, setRepas] = useState<RepasItem[]>([]);

  const updateRepasWithCalories = async () => {
    try {
      const storedRepas = await AsyncStorage.getItem("repas");
      if (!storedRepas) return;

      const repasArray = JSON.parse(storedRepas);

      const updatedRepas = await Promise.all(
        repasArray.map(async (repas: RepasItem) => {
          const nutrimentsData = await Promise.all(
            repas.foods.map(async (food) => {
              const response = await fetch(
                `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_API_ID}&app_key=${EDAMAM_API_KEY}&ingr=${food}`
              );

              const data = await response.json();
              if (data?.parsed && data.parsed.length > 0) {
                return data.parsed[0].food.nutrients.ENERC_KCAL || 0;
              } else {
                console.warn(`Aucune donnée trouvée pour ${food}`);
                return 0;
              }
            })
          );

          const totalCalories = nutrimentsData.reduce(
            (sum, calories) => sum + calories,
            0
          );

          return {
            ...repas,
            totalCalories,
          };
        })
      );

      await AsyncStorage.setItem("repas", JSON.stringify(updatedRepas));
    } catch (error) {
      console.error("Erreur lors de la mise à jour des repas :", error);
    }
  };

  useEffect(() => {
    updateRepasWithCalories();
    const loadRepas = async () => {
      try {
        const storedRepas = await AsyncStorage.getItem("repas");
        if (storedRepas) {
          setRepas(JSON.parse(storedRepas));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des repas :", error);
      }
    };

    loadRepas();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽 Mes repas</Text>
      <FlatList
        data={Repas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/${item.id}`)}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>
              Repas du {new Date(item.date).toLocaleDateString()} /{" "}
              {item.totalCalories || 0} kcal
            </Text>
            {item.foods.map((food, index) => (
              <Text key={index} style={styles.foodItem}>
                • {food}
              </Text>
            ))}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  foodItem: {
    fontSize: 16,
    color: "#666",
  },
});
