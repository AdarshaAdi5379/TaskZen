import { TodoApp } from "@/components/todo/todo-app";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start sm:justify-center p-4 sm:p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <TodoApp />
    </div>
  );
}
