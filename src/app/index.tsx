import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { supabase } from "../../lib/supabase";
import LoadingScreen from "./components/Loading";

export default function Index() {
  const [destination, setDestination] = useState<
    "/(auth)" | "/(home)" | null
  >(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !data.session) {
          setDestination("/(auth)");
        } else {
          setDestination("/(home)");
        }
      } catch {
        if (mounted) {
          setDestination("/(auth)");
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (!destination) {
    return <LoadingScreen />;
  }

  return <Redirect href={destination} />;
}