
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TCOTimerProps {
  startTime: Date | null;
  isRunning: boolean;
}

const TCOTimer: React.FC<TCOTimerProps> = ({
  startTime,
  isRunning
}) => {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Monitorar scroll para aplicar efeito flutuante
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50); // Ativar efeito após 50px de scroll
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lógica do timer
  useEffect(() => {
    if (!isRunning || !startTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60)).toString().padStart(2, '0');
      const seconds = Math.floor(diff % (1000 * 60) / 1000).toString().padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  return (
    <Card className={`p-4 flex items-center justify-between ${
      isScrolled ? "fixed top-4 right-4 z-50 shadow-lg" : ""
    }`}>
      <div className="flex items-center">
        <Clock className="mr-2 h-5 w-5 text-green-600" />
        <span className="font-semibold text-green-600">Tempo:</span>
      </div>
      <div className="text-xl font-mono font-bold">{elapsedTime}</div>
    </Card>
  );
};

export default TCOTimer;
