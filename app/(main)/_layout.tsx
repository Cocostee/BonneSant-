import { useAuth } from "@clerk/clerk-expo";
import { Link, Redirect, Stack } from "expo-router";
import { Pressable, Text } from "react-native";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerLeft: () => (
            <Link href="/profile" asChild>
              <Pressable>
                <Text style={{ color: "blue", fontSize: 16 }}>Profile</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
    </Stack>
  );
}
