"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, User, Settings, LogOut, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useUserWallets } from "@dynamic-labs/sdk-react-core"
import { useEffect, useState } from "react"
import { readContract } from 'viem/actions'
import { publicClient, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

export function Navigation() {
  const { user, handleLogOut, primaryWallet } = useDynamicContext()
  const userWallets = useUserWallets()
  const [balance, setBalance] = useState<string>("")

  useEffect(() => {
    const fetchBalance = async () => {
      if (primaryWallet) {
        try {
          const userBalance = await readContract(publicClient, {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getUserBalance',
            args: [primaryWallet.address as `0x${string}`],
          })
          const formattedBalance = (Number(userBalance) / 1e6).toFixed(2)
          setBalance(`$${formattedBalance}`)
        } catch (error) {
          setBalance("$0.00")
        }
      }
    }

    fetchBalance()
  }, [primaryWallet])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60] bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-foreground hover:text-muted-foreground transition-colors">
              DecentralAI
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 h-auto py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-transparent border-0">
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    <span className="font-mono">
                      {primaryWallet ? formatAddress(primaryWallet.address) : "No wallet"}
                    </span>
                    <span className="text-foreground font-medium">{balance}</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[100]">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={() => handleLogOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/login">
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
