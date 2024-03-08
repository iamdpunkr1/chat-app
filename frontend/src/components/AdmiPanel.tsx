import ChatArea from "./ChatArea"

const AdmiPanel = () => {
  return (
    <>
    <div className="flex  justify-between w-full">
        <h1 className="text-2xl font-semibold mb-4 underline">Admin Panel</h1>
        <button className="btn btn-outline btn-sm">Logout</button>
    </div>
    <div className="flex flex-wrap gap-4 w-full my-4">
            <span className="flex space-between gap-8 border-2 rounded-md p-2 bg-base-200">
                <h2 className="text-sm ">User-Dipankar</h2>
                <button className="btn btn-xs btn-neutral">Take</button>
            </span>

            <span className="flex space-between gap-8 border-2 rounded-md p-2 bg-base-200">
                <h2 className="text-sm ">User-Dipankar</h2>
                <button className="btn btn-xs btn-neutral">Take</button>
            </span>

            <span className="flex space-between gap-8 border-2 rounded-md p-2 bg-base-200">
                <h2 className="text-sm ">User-Dipankar</h2>
                <button className="btn btn-xs btn-neutral">Take</button>
            </span>
    </div>
    <ChatArea/>
    </>
  )
}

export default AdmiPanel