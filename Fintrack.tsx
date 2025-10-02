"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trash2, TrendingUp, TrendingDown, PieChart, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { TransactionChart } from "@/components/transaction-chart"
import { CategoryChart } from "@/components/category-chart"
import { ExpenseCalendar } from "@/components/expense-calendar"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  description: string
  date: string
}

interface ExchangeRates {
  [key: string]: number
}

const CATEGORIES = {
  income: ["Salary", "Freelance Work", "Side Hustle", "Investment Returns", "Gift Money", "Other"],
  expense: ["Groceries", "Gas & Transport", "Shopping", "Utilities", "Fun Stuff", "Medical", "Rent/Mortgage", "Other"],
}

// TODO: maybe add more currencies later?
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"]

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentCurrency, setCurrentCurrency] = useState("INR")
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1 }) // shortened variable name
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({}) // more descriptive name

  // Quick income stuff - added this later for easier income entry
  const [quickIncome, setQuickIncome] = useState({
    amount: "",
    category: "Salary",
  })
  const [quickErrors, setQuickErrors] = useState<{ [key: string]: string }>({})

  // Load saved data when app starts
  useEffect(() => {
    const savedTransactions = localStorage.getItem("finance-transactions")
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions))
      } catch (e) {
        console.log("Error loading transactions:", e)
        // If data is corrupted, start fresh
        localStorage.removeItem("finance-transactions")
      }
    }
  }, [])

  // Auto-save transactions
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem("finance-transactions", JSON.stringify(transactions))
    }
  }, [transactions])

  // Get exchange rates from API
  useEffect(() => {
    const getRates = async () => {
      try {
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
        if (response.ok) {
          const data = await response.json()
          setRates(data.rates)
        }
      } catch (error) {
        console.log("Couldn't fetch exchange rates:", error)
        // Just use USD if API fails
      }
    }
    getRates()
  }, [])

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    const amt = Number.parseFloat(formData.amount)
    if (!formData.amount || amt <= 0 || isNaN(amt)) {
      errors.amount = "Please enter a valid amount"
    }
    if (!formData.category) {
      errors.category = "Pick a category"
    }
    if (formData.category === "Other" && !formData.description?.trim()) {
      errors.description = "Add a description for Other category"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddTransaction = () => {
    if (!validateForm()) return

    const enteredAmount = Number.parseFloat(formData.amount)
    const exchangeRate = rates[currentCurrency] || 1
    const amountInUSD = enteredAmount / exchangeRate // Convert to USD for storage

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: formData.type,
      amount: amountInUSD, // Store in USD
      category: formData.category,
      description: formData.category === "Other" ? formData.description : formData.category,
      date: new Date().toISOString().split("T")[0],
    }

    setTransactions([newTransaction, ...transactions])
    setFormData({ type: "expense", amount: "", category: "", description: "" })
    setFormErrors({})
  }

  const validateQuickIncome = () => {
    const errors: { [key: string]: string } = {}
    const amt = Number.parseFloat(quickIncome.amount)

    if (!quickIncome.amount || amt <= 0 || isNaN(amt)) {
      errors.amount = "Enter amount"
    }

    setQuickErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleQuickIncome = () => {
    if (!validateQuickIncome()) return

    const enteredAmount = Number.parseFloat(quickIncome.amount)
    const exchangeRate = rates[currentCurrency] || 1
    const amountInUSD = enteredAmount / exchangeRate // Convert to USD for storage

    const incomeTransaction: Transaction = {
      id: Date.now().toString(),
      type: "income",
      amount: amountInUSD, // Store in USD
      category: quickIncome.category,
      description: quickIncome.category,
      date: new Date().toISOString().split("T")[0],
    }

    setTransactions([incomeTransaction, ...transactions])
    setQuickIncome({ amount: "", category: "Salary" })
    setQuickErrors({})
  }

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  const getBalance = () => {
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount
      } else {
        totalExpenses += t.amount
      }
    })

    return totalIncome - totalExpenses
  }

  const convertToCurrentCurrency = (amount: number) => {
    const rate = rates[currentCurrency] || 1
    return (amount * rate).toFixed(2)
  }

  // For the pie chart
  const getExpensesByCategory = () => {
    const categoryTotals: { [key: string]: number } = {}

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
      })

    return categoryTotals
  }

  // Calculate totals
  const balance = getBalance()
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-8">
        <div className="text-center space-y-3 py-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">Finance Tracker</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take control of your finances with smart tracking and insights
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Label htmlFor="currency" className="text-base font-medium">
                Display Currency:
              </Label>
              <Select value={currentCurrency} onValueChange={setCurrentCurrency}>
                <SelectTrigger className="w-40 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-accent/20">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              Quick Add Income
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-amount" className="text-sm font-medium">
                  Amount ({currentCurrency})
                </Label>
                <Input
                  id="quick-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quickIncome.amount}
                  onChange={(e) => setQuickIncome({ ...quickIncome, amount: e.target.value })}
                  className={`h-12 text-lg ${quickErrors.amount ? "border-destructive" : "border-2"}`}
                />
                {quickErrors.amount && <p className="text-sm text-destructive">{quickErrors.amount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
                  value={quickIncome.category}
                  onValueChange={(value) => setQuickIncome({ ...quickIncome, category: value })}
                >
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.income.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleQuickIncome}
                  className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                >
                  <ArrowUpRight className="mr-2 h-5 w-5" />
                  Add Income
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Total Balance
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl md:text-4xl font-bold ${balance >= 0 ? "text-accent" : "text-destructive"}`}>
                {currentCurrency} {convertToCurrentCurrency(balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {balance >= 0 ? "Looking good!" : "Time to save more"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-accent/10 to-accent/5 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Total Income
              </CardTitle>
              <div className="p-2 rounded-lg bg-accent/20">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-accent">
                {currentCurrency} {convertToCurrentCurrency(totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Money coming in</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-destructive/10 to-destructive/5 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Total Expenses
              </CardTitle>
              <div className="p-2 rounded-lg bg-destructive/20">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-destructive">
                {currentCurrency} {convertToCurrentCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Money going out</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/50 p-1">
            <TabsTrigger value="transactions" className="text-base font-medium">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-base font-medium">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-base font-medium">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="add" className="text-base font-medium">
              Add New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Monthly Expense Calendar</CardTitle>
                <p className="text-sm text-muted-foreground">Track your daily spending patterns</p>
              </CardHeader>
              <CardContent>
                <ExpenseCalendar
                  transactions={transactions}
                  currency={currentCurrency}
                  exchangeRate={rates[currentCurrency] || 1}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Add New Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">
                      Transaction Type
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "income" | "expense") =>
                        setFormData({ ...formData, type: value, category: "" })
                      }
                    >
                      <SelectTrigger className="h-12 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">💰 Income</SelectItem>
                        <SelectItem value="expense">💸 Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount ({currentCurrency})
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`h-12 text-lg ${formErrors.amount ? "border-destructive" : "border-2"}`}
                    />
                    {formErrors.amount && <p className="text-sm text-destructive">{formErrors.amount}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className={`h-12 ${formErrors.category ? "border-destructive" : "border-2"}`}>
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES[formData.type].map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-sm text-destructive">{formErrors.category}</p>}
                  </div>

                  {formData.category === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description
                      </Label>
                      <Input
                        id="description"
                        placeholder="What was this for?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`h-12 ${formErrors.description ? "border-destructive" : "border-2"}`}
                      />
                      {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddTransaction}
                  className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg"
                >
                  Add Transaction
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                      <Wallet className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-lg text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Start by adding your first transaction!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-5 border-2 rounded-2xl hover:shadow-lg transition-all duration-200 bg-card"
                      >
                        <div className="flex-1 flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${
                              transaction.type === "income" ? "bg-accent/20" : "bg-destructive/20"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <ArrowUpRight className={`h-5 w-5 text-accent`} />
                            ) : (
                              <ArrowDownRight className={`h-5 w-5 text-destructive`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">{transaction.category}</span>
                              <Badge
                                variant={transaction.type === "income" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {transaction.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-bold text-xl ${
                              transaction.type === "income" ? "text-accent" : "text-destructive"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {currentCurrency} {convertToCurrentCurrency(transaction.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransaction(transaction.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-secondary/20">
                      <PieChart className="h-5 w-5 text-secondary" />
                    </div>
                    Spending Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryChart
                    data={getExpensesByCategory()}
                    currency={currentCurrency}
                    exchangeRate={rates[currentCurrency] || 1}
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-secondary/20">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                    </div>
                    Cash Flow Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionChart
                    transactions={transactions}
                    currency={currentCurrency}
                    exchangeRate={rates[currentCurrency] || 1}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
