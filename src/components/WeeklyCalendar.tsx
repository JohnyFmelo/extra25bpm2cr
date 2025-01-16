import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const WeeklyCalendar = () => {
  const currentDate = new Date();
  const weekDays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  
  return (
    <Card className="p-4 w-full max-w-3xl bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-between gap-2">
        {weekDays.map((day, index) => {
          const date = new Date();
          date.setDate(date.getDate() - date.getDay() + index);
          const isToday = format(date, "dd") === format(new Date(), "dd");
          
          return (
            <div
              key={day}
              className={`flex flex-col items-center p-2 rounded-lg ${
                isToday
                  ? "bg-black text-white"
                  : "hover:bg-gray-100 cursor-pointer"
              }`}
            >
              <span className="text-sm capitalize">{day}</span>
              <span className="text-lg font-semibold mt-1">
                {format(date, "dd")}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WeeklyCalendar;