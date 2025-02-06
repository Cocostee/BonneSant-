import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

const EDAMAM_API_ID = process.env.EXPO_PUBLIC_EDAMAM_API_ID;
const EDAMAM_API_KEY = process.env.EXPO_PUBLIC_EDAMAM_API_KEY;

export default function AddRepas() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const searchFood = async () => {
    if (!search) return;
    try {
      const response = await fetch(
        `https://api.edamam.com/auto-complete?app_id=${EDAMAM_API_ID}&app_key=${EDAMAM_API_KEY}&q=${search}`
      );
      const data = await response.json();
      setResults(data.slice(0, 5));
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    }
  };

  const addFood = (food: never) => {
    if (!selectedFoods.includes(food)) {
      setSelectedFoods([...selectedFoods, food]);
    }
  };

  const saveRepas = async () => {
    if (selectedFoods.length === 0) return;

    try {
      const newRepas = {
        id: Math.floor(Math.random() * 50000) + 1,
        foods: selectedFoods,
        date: new Date().toISOString(),
      };

      const storedRepas = await AsyncStorage.getItem("repas");
      const repas = storedRepas ? JSON.parse(storedRepas) : [];

      repas.push(newRepas);
      await AsyncStorage.setItem("repas", JSON.stringify(repas));

      router.push("/");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du repas :", error);
    }
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    setIsScanning(false);
    try {
      const response = await fetch(
        `https://api.edamam.com/auto-complete?app_id=${EDAMAM_API_ID}&app_key=${EDAMAM_API_KEY}&upc=${data}`
      );
      const result = await response.json();

      if (result.length > 0) {
        addFood(result[0]);
      } else {
        alert("Aucun aliment trouvé pour ce QR code.");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche de l'aliment :", error);
    }

    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter un repas</Text>

      <TextInput
        placeholder="Rechercher un aliment..."
        value={search}
        onChangeText={setSearch}
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={searchFood}>
        <Text style={styles.buttonText}>Rechercher</Text>
      </TouchableOpacity>

      <FlatList
        data={results}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => addFood(item)}
            style={styles.listItem}
          >
            <Text style={styles.foodText}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedFoods.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.subtitle}>Aliments sélectionnés :</Text>
          <ScrollView style={styles.selectedScroll}>
            {selectedFoods.map((food, index) => (
              <Text key={index} style={styles.selectedFood}>
                🍽 {food}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedFoods.length > 0 && (
        <TouchableOpacity style={styles.button} onPress={saveRepas}>
          <Text style={styles.buttonText}>Valider le repas</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setIsScanning(true)}
      >
        <Text style={styles.scanButtonText}>📷 Scanner</Text>
      </TouchableOpacity>

      <Modal visible={isScanning} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            type="back"
            barcodeScannerEnabled={true}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsScanning(false)}
          >
            <Text style={styles.closeButtonText}>❌ Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "white",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  list: {
    marginTop: 10,
  },
  listItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedContainer: {
    height: 150,
    marginTop: 20,
    padding: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
  },
  selectedScroll: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  selectedFood: {
    fontSize: 18,
    marginBottom: 10,
  },
  scanButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
