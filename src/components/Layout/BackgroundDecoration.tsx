import { motion } from "motion/react";

export function BackgroundDecoration() {
  const shapes = [
    { color: "#7DD3FC", size: 300, left: "10%", top: "20%", delay: 0 },
    { color: "#FBCFE8", size: 400, left: "70%", top: "60%", delay: 2 },
    { color: "#FDE68A", size: 250, left: "85%", top: "10%", delay: 4 },
    { color: "#BBF7D0", size: 350, left: "20%", top: "70%", delay: 6 },
    { color: "#C4B5FD", size: 200, left: "50%", top: "40%", delay: 3 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-3xl"
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.left,
            top: shape.top,
            backgroundColor: shape.color,
          }}
          animate={{
            x: [0, 50, 0, -50, 0],
            y: [0, -30, 0, 30, 0],
            scale: [1, 1.1, 1, 0.9, 1],
            opacity: [0.3, 0.5, 0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 20 + index * 2,
            repeat: Infinity,
            delay: shape.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
