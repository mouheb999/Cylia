import Feature from "@/components/Feature";
import Footer from "@/components/Footer";
import Galerie from "@/components/Galerie";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";

export default function Page() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <Feature />
        <Galerie />
      </main>
      <Footer />
    </>
  );
}
