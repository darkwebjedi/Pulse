import AppShell from "@/components/AppShell";
import Backdrop from "@/components/Backdrop";
import Providers from "@/components/Providers";

export default function Page() {
  return (
    <Providers>
      <Backdrop />
      <AppShell />
    </Providers>
  );
}
