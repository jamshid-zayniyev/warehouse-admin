import React from 'react'
import { motion } from "framer-motion"
import { Sparkles } from 'lucide-react'

const Loader = () => {
  return (
     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0">
                    {[...Array(50)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 0.5, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center relative z-10"
                >
                    <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-purple-300/30 border-t-purple-400 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-pink-400 rounded-full animate-ping mx-auto"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white animate-pulse" />
                    </div>
                    <motion.p
                        className="text-white text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        Loading orders...
                    </motion.p>
                    <div className="flex justify-center mt-6 space-x-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.4, 1, 0.4],
                                    y: [0, -10, 0]
                                }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
  )
}

export default Loader