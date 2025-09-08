import SuccessScreen from "./components/SuccessScreen";

export default function App() {
  const handleThemeToggle = () => {
    console.log("Theme toggle clicked");
  };

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SuccessScreen 
        points={1200}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
      />
    </div>
  );
}