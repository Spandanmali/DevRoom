import { Terminal, Code2, Braces } from "lucide-react"

export function PageBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Diagonal lines pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(255,255,255,0.05) 100px,
            rgba(255,255,255,0.05) 101px
          )`
        }}
      />
      
      {/* Large radial glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 50%)'
        }}
      />
      
      {/* Secondary glow - top left */}
      <div 
        className="absolute -top-40 -left-40 w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)'
        }}
      />
      
      {/* Secondary glow - bottom right */}
      <div 
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 60%)'
        }}
      />
      
      {/* Floating code snippets */}
      <div className="absolute top-[12%] left-[8%] text-xs font-mono text-muted-foreground/15 select-none rotate-[-8deg]">
        {'const room = await createRoom()'}
      </div>
      <div className="absolute top-[18%] right-[12%] text-xs font-mono text-muted-foreground/15 select-none rotate-[5deg]">
        {'// real-time collaboration'}
      </div>
      <div className="absolute bottom-[35%] left-[5%] text-xs font-mono text-muted-foreground/15 select-none rotate-[3deg]">
        {'users.forEach(u => sync(u))'}
      </div>
      <div className="absolute bottom-[25%] right-[8%] text-xs font-mono text-muted-foreground/15 select-none rotate-[-4deg]">
        {'socket.emit("code:update")'}
      </div>
      <div className="absolute top-[55%] left-[15%] text-xs font-mono text-muted-foreground/15 select-none rotate-[-2deg]">
        {'<Editor mode="collaborative" />'}
      </div>
      <div className="absolute top-[38%] right-[6%] text-xs font-mono text-muted-foreground/15 select-none rotate-[6deg]">
        {'await room.join(userId)'}
      </div>
      <div className="absolute bottom-[15%] left-[25%] text-xs font-mono text-muted-foreground/15 select-none rotate-[2deg]">
        {'broadcast(changes)'}
      </div>
      <div className="absolute top-[70%] right-[20%] text-xs font-mono text-muted-foreground/15 select-none rotate-[-5deg]">
        {'cursor.position = { x, y }'}
      </div>
      
      {/* Decorative icons */}
      <Terminal className="absolute top-[20%] left-[25%] w-8 h-8 text-muted-foreground/5 rotate-12" />
      <Code2 className="absolute bottom-[30%] right-[25%] w-10 h-10 text-muted-foreground/5 -rotate-12" />
      <Braces className="absolute top-[65%] left-[10%] w-6 h-6 text-muted-foreground/5 rotate-6" />
      <Terminal className="absolute bottom-[18%] right-[15%] w-7 h-7 text-muted-foreground/5 -rotate-6" />
      
      {/* Dotted pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
    </div>
  )
}
