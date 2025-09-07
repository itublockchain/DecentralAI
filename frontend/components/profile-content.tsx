"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpRight, ArrowDownLeft, Coins, Activity, DollarSign, Zap, Calendar, TrendingUp, Copy } from "lucide-react"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { isEthereumWallet } from "@dynamic-labs/ethereum"
import { useState, useEffect } from "react"
import { readContract, writeContract } from 'viem/actions'
import { encodeFunctionData } from 'viem'
import { publicClient, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileContent() {
  const { primaryWallet } = useDynamicContext()
  const [balance, setBalance] = useState<string>("0")
  const [usdcBalance, setUsdcBalance] = useState<string>("0")
  const [ethBalance, setEthBalance] = useState<string>("0")
  const [stakeAmount, setStakeAmount] = useState<string>("")
  const [isStaking, setIsStaking] = useState(false)
  const [txnHash, setTxnHash] = useState("")
  const [copied, setCopied] = useState(false)

  const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Please connect your Ethereum wallet to access your profile</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const fetchBalance = async () => {
      if (primaryWallet) {
        try {
          // Get contract balance
          const userBalance = await readContract(publicClient, {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getUserBalance',
            args: [primaryWallet.address as `0x${string}`],
          })
          const formattedBalance = (Number(userBalance) / 1e6).toFixed(2)
          setBalance(formattedBalance)

          // Get USDC balance
          const usdcBalanceResult = await readContract(publicClient, {
            address: USDC_ADDRESS,
            abi: [
              {
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
              }
            ],
            functionName: 'balanceOf',
            args: [primaryWallet.address as `0x${string}`],
          })
          const formattedUsdcBalance = (Number(usdcBalanceResult) / 1e6).toFixed(2)
          setUsdcBalance(formattedUsdcBalance)

          // Get ETH balance
          const ethBalanceResult = await publicClient.getBalance({
            address: primaryWallet.address as `0x${string}`
          })
          const formattedEthBalance = Number(ethBalanceResult) / 1e18
          setEthBalance(formattedEthBalance.toFixed(4))

          // Get user data from contract
          const userData = await readContract(publicClient, {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getUser',
            args: [primaryWallet.address as `0x${string}`],
          })
          console.log('User data from contract:', userData)
        } catch (error) {
          setBalance("0.00")
          setUsdcBalance("0.00")
        }
      }
    }

    fetchBalance()
  }, [primaryWallet])

  const handleStake = async () => {
    if (!primaryWallet || !stakeAmount || parseFloat(stakeAmount) <= 0) return

    // Check if user has enough USDC
    if (parseFloat(usdcBalance) < parseFloat(stakeAmount)) {
      alert(`Insufficient USDC balance. You have $${usdcBalance} but trying to stake $${stakeAmount}`)
      return
    }

    setIsStaking(true)
    try {
      const amountInWei = (parseFloat(stakeAmount) * 1e6).toString()
      
      const publicClient = await primaryWallet.getPublicClient()
      const walletClient = await primaryWallet.getWalletClient()


      // First approve USDC spending using writeContract
      const approveHash = await writeContract(walletClient, {
        address: USDC_ADDRESS,
        abi: [
          {
            "inputs": [
              {"internalType": "address", "name": "spender", "type": "address"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, BigInt(amountInWei)],
      })
      console.log('Approval transaction sent:', approveHash)
      
      // Wait for approval with retry logic
      let approvalReceipt = null
      let retries = 0
      const maxRetries = 30 // 30 attempts = ~60 seconds
      
      while (!approvalReceipt && retries < maxRetries) {
        try {
          approvalReceipt = await publicClient.getTransactionReceipt({ hash: approveHash })
          break
        } catch (error) {
          retries++
          console.log(`Waiting for approval confirmation... (${retries}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        }
      }
      
      if (!approvalReceipt) {
        console.log('Approval transaction sent but taking longer than expected. Continuing with stake...')
        // Continue anyway after reasonable wait
      } else {
        console.log('Approval confirmed, now staking...')
      }

      // Then stake using writeContract
      const hash = await writeContract(walletClient, {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'stake',
        args: [BigInt(amountInWei)],
      })
      setTxnHash(hash)
      console.log('Stake transaction sent:', hash)

      // Wait for stake transaction with retry logic
      let stakeReceipt = null
      let stakeRetries = 0
      const maxStakeRetries = 30 // 30 attempts = ~60 seconds
      
      while (!stakeReceipt && stakeRetries < maxStakeRetries) {
        try {
          stakeReceipt = await publicClient.getTransactionReceipt({ hash })
          break
        } catch (error) {
          stakeRetries++
          console.log(`Waiting for stake confirmation... (${stakeRetries}/${maxStakeRetries})`)
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        }
      }
      
      if (stakeReceipt) {
        console.log('Stake transaction confirmed:', stakeReceipt)
      } else {
        console.log('Stake transaction sent but taking longer than expected to confirm')
      }

      // Refresh balance after staking
      const userBalance = await readContract(publicClient, {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUserBalance',
        args: [primaryWallet.address as `0x${string}`],
      })
      const formattedBalance = (Number(userBalance) / 1e6).toFixed(2)
      setBalance(formattedBalance)
      setStakeAmount("")
    } catch (error) {
      console.error('Staking failed:', error)
      alert(`Staking failed: ${error instanceof Error ? error.message : error}`)
    } finally {
      setIsStaking(false)
    }
  }

  const copyAddress = async () => {
    if (primaryWallet?.address) {
      await navigator.clipboard.writeText(primaryWallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
            <p className="text-muted-foreground">Manage your contributions, API usage, and wallet balance</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {primaryWallet?.address ? formatAddress(primaryWallet.address) : 'Not connected'}
              </code>
              {primaryWallet?.address && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="h-8 px-2"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">${balance}</div>
                  <div className="text-sm text-muted-foreground">USDC Balance: ${usdcBalance}</div>
                </div>
                <div className="flex gap-2">
                  <Button>
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="space-y-3">
                  <Label htmlFor="stake-amount">Stake Amount (USDC)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stake-amount"
                      type="number"
                      placeholder="0.00"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <Button 
                      onClick={handleStake} 
                      disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                      className="min-w-[100px]"
                    >
                      {isStaking ? "Staking..." : "Stake"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contributions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contributions">My Contributions</TabsTrigger>
          <TabsTrigger value="usage">API Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">Datasets contributed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Models Contributed</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Active models</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$234.80</div>
                <p className="text-xs text-muted-foreground">Awaiting distribution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$3,650.00</div>
                <p className="text-xs text-muted-foreground">All-time earnings</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">MedicalAI Pro</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <CardDescription>Medical diagnosis and treatment AI model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Datasets Contributed</p>
                    <p className="text-lg font-semibold">25</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Distribution</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Jan 15, 2025
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Earnings</p>
                    <p className="text-lg font-semibold text-green-600">$156.30</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-lg font-semibold">$2,450.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">LegalAI Assistant</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <CardDescription>Legal research and document analysis AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Datasets Contributed</p>
                    <p className="text-lg font-semibold">12</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Distribution</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Feb 1, 2025
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Earnings</p>
                    <p className="text-lg font-semibold text-green-600">$78.50</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-lg font-semibold">$1,200.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">FinancialAI Analyst</CardTitle>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    Funding
                  </Badge>
                </div>
                <CardDescription>Financial analysis and market prediction AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Datasets Contributed</p>
                    <p className="text-lg font-semibold">8</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Launch</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Mar 15, 2025
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Earnings</p>
                    <p className="text-lg font-semibold text-gray-500">$0.00</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Value</p>
                    <p className="text-lg font-semibold">$640.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Input Tokens</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4M</div>
                <p className="text-xs text-muted-foreground">Total consumed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Output Tokens</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.8M</div>
                <p className="text-xs text-muted-foreground">Total generated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$456.78</div>
                <p className="text-xs text-muted-foreground">All-time spending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Models Used</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Different models</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">MedicalAI Pro</CardTitle>
                  <Badge variant="secondary">Most Used</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Input Tokens</p>
                    <p className="text-lg font-semibold">1.2M</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Output Tokens</p>
                    <p className="text-lg font-semibold">890K</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-semibold">$234.50</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Used</p>
                    <p className="text-lg font-semibold">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">LegalAI Assistant</CardTitle>
                  <Badge variant="outline">Regular</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Input Tokens</p>
                    <p className="text-lg font-semibold">800K</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Output Tokens</p>
                    <p className="text-lg font-semibold">650K</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-semibold">$156.30</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Used</p>
                    <p className="text-lg font-semibold">1 day ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">FinancialAI Analyst</CardTitle>
                  <Badge variant="outline">Occasional</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Input Tokens</p>
                    <p className="text-lg font-semibold">400K</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Output Tokens</p>
                    <p className="text-lg font-semibold">260K</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-semibold">$65.98</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Used</p>
                    <p className="text-lg font-semibold">3 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>Your deposit, withdrawal, and earning history</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Dec 15, 2024</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Distribution
                    </Badge>
                  </TableCell>
                  <TableCell>Monthly revenue from MedicalAI Pro</TableCell>
                  <TableCell className="text-green-600">+$156.30</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dec 12, 2024</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Distribution
                    </Badge>
                  </TableCell>
                  <TableCell>Monthly revenue from LegalAI Assistant</TableCell>
                  <TableCell className="text-green-600">+$78.50</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dec 10, 2024</TableCell>
                  <TableCell>
                    <Badge variant="outline">Usage</Badge>
                  </TableCell>
                  <TableCell>MedicalAI Pro API calls</TableCell>
                  <TableCell className="text-red-600">-$45.20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dec 5, 2024</TableCell>
                  <TableCell>
                    <Badge variant="default">Deposit</Badge>
                  </TableCell>
                  <TableCell>Wallet top-up via credit card</TableCell>
                  <TableCell className="text-green-600">+$500.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Nov 28, 2024</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Withdraw
                    </Badge>
                  </TableCell>
                  <TableCell>Withdrawal to bank account</TableCell>
                  <TableCell className="text-red-600">-$300.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
