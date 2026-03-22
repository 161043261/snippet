import Shell from "../shell";

const CssPikachu = () => {
  return (
    <Shell title="/css" subtitle="CSS Implementation">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <div className="relative min-h-91.25 w-full bg-[#ffe600]">
            <div className="absolute top-1/2 left-1/2 -mt-38.5 -ml-40 h-21 w-21 rounded-full border-[3px] border-black bg-[#2e2e2e]">
              <div className="mt-0.5 ml-3.5 h-9 w-9 rounded-full border-[3px] border-black bg-white" />
            </div>
            <div className="absolute top-1/2 left-1/2 -mt-38.5 ml-19 h-21 w-21 rounded-full border-[3px] border-black bg-[#2e2e2e]">
              <div className="mt-0.5 ml-3.5 h-9 w-9 rounded-full border-[3px] border-black bg-white" />
            </div>
            <div className="absolute top-1/2 left-1/2 -mt-25 -ml-5 h-10 w-10 rounded-[50%_50%_0_0] border-20 border-solid border-t-black border-r-transparent border-b-transparent border-l-transparent" />

            <div className="absolute top-36.25 right-1/2 z-10 h-6.25 w-20 -rotate-20 rounded-bl-[40px_25px] border-2 border-t-0 border-r-0 border-black bg-[#fde348]" />
            <div className="absolute top-36.25 left-1/2 z-10 h-6.25 w-20 rotate-20 rounded-br-[40px_25px] border-2 border-t-0 border-l-0 border-black bg-[#fde348]" />

            <div className="absolute top-1/2 left-1/2 -mt-7.5 -ml-37.5 h-35 w-75 overflow-hidden">
              <div className="absolute bottom-0 h-875 w-75 overflow-hidden rounded-[200px/2000px] border-2 border-black bg-[#990513] after:absolute after:-bottom-2.5 after:left-1/2 after:-ml-12.5 after:h-25 after:w-25 after:rounded-full after:bg-[#fc4a62] after:content-['']" />
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -mt-12.5 -ml-60 h-25 w-25 rounded-full border-4 border-black bg-[#ff0000]" />
          <div className="absolute top-1/2 left-1/2 -mt-12.5 ml-37.5 h-25 w-25 rounded-full border-4 border-black bg-[#ff0000]" />
        </div>
      </div>
    </Shell>
  );
};

export default CssPikachu;
