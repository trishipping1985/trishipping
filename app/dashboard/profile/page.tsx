export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4af37]">Profile</h1>
      <p className="mt-2 text-white/65 text-sm">
        Your profile details will be stored in Supabase (name, phone, address).
      </p>

      <div className="mt-6 rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
        <div className="text-sm font-semibold">Profile setup</div>
        <div className="mt-2 text-sm text-white/60">
          Next step: create a <span className="text-white">profiles</span> table
          and allow users to update their info.
        </div>
      </div>
    </div>
  );
}
