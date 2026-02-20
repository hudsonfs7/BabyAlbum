
export const calculateBabyAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffInMs = now.getTime() - birth.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) return "Recém-chegado";
  
  // Menos de 1 semana -> Dias
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  }

  // Menos de 1 mês (aprox 30 dias) -> Semanas
  // Correção: Prioriza semanas até completar 30 dias para evitar "0 meses"
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }

  // Menos de 1 ano -> Meses
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30.44);
    // Fallback de segurança: se o cálculo der 0 (ex: 29 dias e a lógica cair aqui), retorna semanas
    if (months < 1) {
       const weeks = Math.floor(diffInDays / 7);
       return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  // Mais de 1 ano -> Anos
  const years = Math.floor(diffInDays / 365.25);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
};
