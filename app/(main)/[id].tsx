import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EDAMAM_API_ID = process.env.EXPO_PUBLIC_EDAMAM_API_ID;
const EDAMAM_API_KEY = process.env.EXPO_PUBLIC_EDAMAM_API_KEY;

interface Repas {
  id: string;
  date: string;
  foods: string[];
}
interface Nutriment {
  name: string;
  image: string | null;
  nutrients: {
    ENERC_KCAL?: number;
    PROCNT?: number;
    FAT?: number;
    CHOCDF?: number;
    FIBTG?: number;
  };
}

export default function RepasDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [repas, setRepas] = useState<Repas | null>(null);

  const [nutriments, setNutriments] = useState<Nutriment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    router.setParams({ headerTitle: "Information repas" });
  }, []);

  useEffect(() => {
    const fetchRepas = async () => {
      try {
        const storedRepas = await AsyncStorage.getItem("repas");
        if (storedRepas) {
          const repasArray = JSON.parse(storedRepas);
          const repasFound = repasArray.find(
            (r: { id: { toString: () => string | string[] } }) =>
              r.id.toString() === id
          );
          if (repasFound) {
            setRepas(repasFound);
            fetchNutriments(repasFound.foods);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du repas :", error);
      }
    };

    fetchRepas();
  }, [id]);

  const deleteRepas = async () => {
    try {
      const storedRepas = await AsyncStorage.getItem("repas");
      if (storedRepas) {
        const repasArray = JSON.parse(storedRepas);
        const updatedRepas = repasArray.filter(
          (r: { id: { toString: () => string | string[] } }) =>
            r.id.toString() !== id
        );
        await AsyncStorage.setItem("repas", JSON.stringify(updatedRepas));
        router.push("/");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du repas :", error);
    }
  };

  const fetchNutriments = async (foods: any[]) => {
    try {
      const nutrimentsData = await Promise.all(
        foods.map(async (food) => {
          const response = await fetch(
            `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_API_ID}&app_key=${EDAMAM_API_KEY}&ingr=${food}`
          );

          const data = await response.json();

          if (data?.parsed && data.parsed.length > 0) {
            return {
              name: data.parsed[0].food.label,
              image: data.parsed[0].food.image || null,
              nutrients: data.parsed[0].food.nutrients || {},
            };
          } else {
            console.warn(`Aucune donnée trouvée pour ${food}`);
            return null;
          }
        })
      );

      const filteredNutriments = nutrimentsData.filter((n) => n !== null);
      setNutriments(filteredNutriments);

      // Calcul du total calorique
      const total = filteredNutriments.reduce(
        (sum, nutriment) => sum + (nutriment.nutrients.ENERC_KCAL || 0),
        0
      );
      setTotalCalories(total);
    } catch (error) {
      console.error("Erreur lors de la récupération des nutriments :", error);
    } finally {
      setLoading(false);
    }
  };

  if (!repas || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Total calorique */}
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesTitle}>🔥 Total calorique :</Text>
        <Text style={styles.caloriesValue}>{totalCalories} kcal</Text>
      </View>

      {/* Date du repas */}
      <Text style={styles.dateTitle}>
        🍽 Repas du {new Date(repas.date).toLocaleDateString()}
      </Text>

      {/* Affichage des nutriments */}
      {nutriments.length > 0 && (
        <View>
          <Text style={styles.nutrimentsTitle}>Valeurs nutritionnelles :</Text>
          {nutriments.map((nutriment, index) => (
            <View key={index} style={styles.nutrimentBox}>
              <View style={styles.nutrimentHeader}>
                {nutriment.image && (
                  <Image
                    source={{ uri: nutriment.image }}
                    style={styles.nutrimentImage}
                  />
                )}
                <Text style={styles.nutrimentName}>{nutriment.name}</Text>
              </View>
              <Text>Calories : {nutriment.nutrients.ENERC_KCAL} kcal</Text>
              <Text>Protéines : {nutriment.nutrients.PROCNT} g</Text>
              <Text>Matières grasses : {nutriment.nutrients.FAT} g</Text>
              <Text>Glucides : {nutriment.nutrients.CHOCDF} g</Text>
              <Text>Fibres : {nutriment.nutrients.FIBTG} g</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.ingredientsTitle}>Ingrédients :</Text>
      {repas.foods.map((food, index) => (
        <Text key={index} style={styles.ingredientItem}>
          - {String(food)}
        </Text>
      ))}

      <Button title="Supprimer" onPress={deleteRepas} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  caloriesContainer: {
    backgroundColor: "#ffcc00",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  caloriesTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  caloriesValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  dateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  nutrimentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  nutrimentBox: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  nutrimentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  nutrimentImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  nutrimentName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  ingredientItem: {
    fontSize: 16,
  },
});
