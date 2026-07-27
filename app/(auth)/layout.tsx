export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sk-light-surface min-h-screen flex flex-col justify-center items-center p-4 bg-[#F5F0E8]">
      {children}
    </div>
  );
}
