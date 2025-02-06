import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack, useRouter } from "expo-router";
import { Button } from "react-native";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  if (!isSignedIn) {
    return <Redirect href={"/sign-in"} />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerRight: () => (
            <Button title="Add" onPress={() => router.push("/add")} />
          ),
          headerLeft: () => (
            <Button title="Profile" onPress={() => router.push("/profile")} />
          ),
        }}
      />
    </Stack>
  );
}
