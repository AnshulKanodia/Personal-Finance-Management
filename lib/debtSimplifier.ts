export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

export interface MemberBalanceSummary {
  name: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // positive = owed money, negative = owes money
}

export interface GroupSettlementAnalysis {
  memberSummaries: MemberBalanceSummary[];
  simplifiedDebts: SimplifiedDebt[];
  totalGroupSpend: number;
}

export function simplifyGroupDebts(
  members: { name: string }[],
  expenses: {
    amount: number;
    paidBy: string;
    splitBetween: { name: string; shareAmount: number }[];
  }[]
): GroupSettlementAnalysis {
  const memberMap: Record<string, { totalPaid: number; totalShare: number }> = {};

  members.forEach((m) => {
    memberMap[m.name] = { totalPaid: 0, totalShare: 0 };
  });

  let totalGroupSpend = 0;

  expenses.forEach((exp) => {
    totalGroupSpend += exp.amount;
    if (!memberMap[exp.paidBy]) {
      memberMap[exp.paidBy] = { totalPaid: 0, totalShare: 0 };
    }
    memberMap[exp.paidBy].totalPaid += exp.amount;

    exp.splitBetween.forEach((split) => {
      if (!memberMap[split.name]) {
        memberMap[split.name] = { totalPaid: 0, totalShare: 0 };
      }
      memberMap[split.name].totalShare += split.shareAmount;
    });
  });

  const memberSummaries: MemberBalanceSummary[] = Object.keys(memberMap).map((name) => {
    const data = memberMap[name];
    return {
      name,
      totalPaid: Math.round(data.totalPaid),
      totalShare: Math.round(data.totalShare),
      netBalance: Math.round(data.totalPaid - data.totalShare),
    };
  });

  // Separate creditors and debtors
  interface PersonBalance {
    name: string;
    amount: number;
  }

  const debtors: PersonBalance[] = [];
  const creditors: PersonBalance[] = [];

  memberSummaries.forEach((s) => {
    if (s.netBalance < -1) {
      debtors.push({ name: s.name, amount: Math.abs(s.netBalance) });
    } else if (s.netBalance > 1) {
      creditors.push({ name: s.name, amount: s.netBalance });
    }
  });

  const simplifiedDebts: SimplifiedDebt[] = [];

  // Greedy 2-pointer matching algorithm
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by amount
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0) {
      simplifiedDebts.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settledAmount),
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 1) debtors.shift();
    if (creditor.amount < 1) creditors.shift();
  }

  return {
    memberSummaries,
    simplifiedDebts,
    totalGroupSpend,
  };
}
