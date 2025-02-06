import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

interface RepasItem {
  id: number;
  date: string;
  foods: string[];
  totalCalories: number;
}

const EDAMAM_API_ID = process.env.EXPO_PUBLIC_EDAMAM_API_ID;
const EDAMAM_API_KEY = process.env.EXPO_PUBLIC_EDAMAM_API_KEY;

export default function HomeScreen() {
  const [Repas, setRepas] = useState<RepasItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    loadRepas();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽 Mes repas</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Chargement des repas...</Text>
        </View>
      ) : Repas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun repas enregistré 😕</Text>
        </View>
      ) : (
        <FlatList
          data={Repas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Link href={`/${item.id}`} asChild>
              <TouchableOpacity style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    📅 {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.caloriesText}>
                    🔥 {item.totalCalories || 0} kcal
                  </Text>
                </View>
                {item.foods.map((food, index) => (
                  <Text key={index} style={styles.foodItem}>
                    • {food}
                  </Text>
                ))}
              </TouchableOpacity>
            </Link>
          )}
        />
      )}

      {/* Bouton flottant pour ajouter un repas */}
      <Link href="/add" asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E63946",
  },
  foodItem: {
    fontSize: 16,
    color: "#666",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
});
