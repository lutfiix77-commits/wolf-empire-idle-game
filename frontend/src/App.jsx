import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react'

const GLOBAL_WALLET = "UQDMZSmwFhgOvwMwR-swLtmL6gvYH_bCDP0h7KFL1rlL3ojS"

export default function App() {
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(1)
  const [activeTab, setActiveTab] = useState('HOME')
  const [tonConnectUI] = useTonConnectUI()

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()

    sync()

    const i = setInterval(sync, 5000)
    return () => clearInterval(i)
  }, [])

  const sync = async () => {
    const res = await fetch(
      "https://YOUR_SUPABASE_PROJECT.functions.supabase.co/calculateIdleIncome",
      {
        method: "POST",
        body: JSON.stringify({
          telegram_id: WebApp.initDataUnsafe?.user?.id
        })
      }
    )

    const data = await res.json()
    if (data.success) {
      setBalance(data.balance)
      setIncome(data.income_per_sec || 1)
    }
  }

  const deposit = async (amount) => {
    const res = await fetch(
      "https://YOUR_SUPABASE_PROJECT.functions.supabase.co/createDepositMemo",
      {
        method: "POST",
        body: JSON.stringify({
          telegram_id: WebApp.initDataUnsafe?.user?.id,
          amount
        })
      }
    )

    const { memo, payment_id } = await res.json()

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: GLOBAL_WALLET,
          amount: (amount * 1e9).toString(),
          payload: memo
        }
      ]
    })

    await fetch(
      "https://YOUR_SUPABASE_PROJECT.functions.supabase.co/verifyTONDeposit",
      {
        method: "POST",
        body: JSON.stringify({
          payment_id,
          telegram_id: WebApp.initDataUnsafe?.user?.id
        })
      }
    )
  }

  return (
    <div style={{ background: "#0f172a", color: "white", minHeight: "100vh" }}>
      <h1>🐺 Wolf Empire</h1>

      <h2>{balance.toFixed(4)} TON</h2>
      <p>+{income}/sec</p>

      <button onClick={() => deposit(1)}>
        Deposit 1 TON
      </button>

      <div style={{ position: "fixed", bottom: 0 }}>
        {["HOME","REFERRAL","SHOP","WITHDRAW"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
      }
