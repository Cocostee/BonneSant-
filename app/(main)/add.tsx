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
      setResults(data);
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
    console.log("Scanned data:", data);
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
      <Button title="Rechercher" onPress={searchFood} />

      <FlatList
        data={results}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => addFood(item)}
            style={styles.listItem}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedFoods.length > 0 && (
        <ScrollView style={styles.selectedContainer}>
          <Text style={styles.subtitle}>Aliments sélectionnés :</Text>
          {selectedFoods.map((food, index) => (
            <Text key={index} style={styles.selectedFood}>
              🍽 {food}
            </Text>
          ))}
        </ScrollView>
      )}

      {selectedFoods.length > 0 && (
        <Button title="Valider le repas" onPress={saveRepas} />
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
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: "white",
  },
  list: {
    marginTop: 10,
  },
  selectedContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
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
  selectedFood: {
    fontSize: 16,
    marginBottom: 5,
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
