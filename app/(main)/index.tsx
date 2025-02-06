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
}

export default function HomeScreen() {
  const router = useRouter();
  const [Repas, setRepas] = useState<RepasItem[]>([]);

  useEffect(() => {
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
              Repas du {new Date(item.date).toLocaleDateString()}
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
