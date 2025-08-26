import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-neutral-900 border-neutral-700",
            headerTitle: "text-orange-500",
            headerSubtitle: "text-neutral-400",
            socialButtonsBlockButton: "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white",
            formButtonPrimary: "bg-orange-600 hover:bg-orange-700 text-white",
            formFieldInput: "bg-neutral-800 border-neutral-700 text-white",
            formFieldLabel: "text-neutral-400",
            footerActionLink: "text-orange-500 hover:text-orange-400"
          }
        }}
      />
    </div>
  );
}