
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const [destination, setDestination] = useState<
    "/(auth)" | "/(home)" | null
  >(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        setDestination("/(auth)");
      } else {
        setDestination("/(home)");
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (!destination) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#065F46" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
