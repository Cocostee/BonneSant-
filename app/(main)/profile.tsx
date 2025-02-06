import React from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { View, Text, Button, StyleSheet } from "react-native";

export default function ProfileScreen() {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {isSignedIn && user ? (
        <>
          <Text style={styles.userInfo}>
            Email: {user.primaryEmailAddress?.emailAddress}
          </Text>
          <Button title="Sign Out" onPress={signOut} />
        </>
      ) : (
        <Text style={styles.userInfo}>Not signed in</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 10,
  },
});
