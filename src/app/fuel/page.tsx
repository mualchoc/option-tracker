import { prisma } from "@/lib/prisma";
import AddFuelForm from "./AddFuelForm";
import FuelTableRow from "./FuelTableRow";

export const dynamic = "force-dynamic";

export default async function FuelPage() {
  const fuel = await prisma.monthlyFuel.findMany({ orderBy: { month: "desc" } });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Monthly Fuel</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Track yield received, deployed capital, and reinvestment</p>
      </div>

      {/* Add entry card */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wide">Log New Entry</h2>
        <AddFuelForm />
      </div>

      {/* History table */}
      {fuel.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-10 text-center text-neutral-600 text-sm">
          No fuel entries yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
          <table className="w-full text-sm">
            <thead className="bg-[#111] border-b border-[#2a2a2a]">
              <tr>
                {["Month", "Yield Received", "Deployed", "Reinvested Back", "Remaining", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fuel.map((f, i) => (
                <FuelTableRow key={f.id} fuel={f} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
