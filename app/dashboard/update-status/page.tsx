"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdateStatusPage() {

const [trackingCode,setTrackingCode] = useState("");
const [status,setStatus] = useState("RECEIVED");
const [location,setLocation] = useState("");
const [note,setNote] = useState("");
const [message,setMessage] = useState("");

async function updateStatus(){

setMessage("");

const code = trackingCode.trim().toUpperCase();

if(!code){
setMessage("Tracking code required");
return;
}

const { data:pkg } = await supabase
.from("packages")
.select("id,tracking_code")
.eq("tracking_code",code)
.single();

if(!pkg){
setMessage("Package not found");
return;
}

await supabase
.from("packages")
.update({status})
.eq("tracking_code",code);

await supabase
.from("package_events")
.insert({
package_id: pkg.id,
tracking_code: pkg.tracking_code,
status,
location,
note
});

setMessage("Status updated");

setTrackingCode("");
setLocation("");
setNote("");
}

return(

<div className="p-8">

<h1 className="text-2xl font-bold mb-6 text-yellow-400">
Update Shipment Status
</h1>

<div className="space-y-4 max-w-lg">

<input
className="w-full p-3 rounded bg-gray-800 text-white"
placeholder="Tracking Code"
value={trackingCode}
onChange={(e)=>setTrackingCode(e.target.value)}
/>

<select
className="w-full p-3 rounded bg-gray-800 text-white"
value={status}
onChange={(e)=>setStatus(e.target.value)}
>
<option>RECEIVED</option>
<option>IN TRANSIT</option>
<option>OUT FOR DELIVERY</option>
<option>DELIVERED</option>
</select>

<input
className="w-full p-3 rounded bg-gray-800 text-white"
placeholder="Location"
value={location}
onChange={(e)=>setLocation(e.target.value)}
/>

<input
className="w-full p-3 rounded bg-gray-800 text-white"
placeholder="Note"
value={note}
onChange={(e)=>setNote(e.target.value)}
/>

<button
onClick={updateStatus}
className="bg-yellow-400 text-black px-6 py-3 rounded font-bold"
>
Update Status
</button>

{message && (
<p className="text-white mt-4">
{message}
</p>
)}

</div>

</div>

);
}
