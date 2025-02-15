
export const fetchUserHours = async (month: string, registration: string) => {
  const apiUrl = `https://script.google.com/macros/s/AKfycbxmUSgKPVz_waNPHdKPT1y8x52xPNS9Yzqx_u1mlH83OabndJQ8Ie2ZZJVJnLIMNOb4/exec`;
  const params = new URLSearchParams({
    mes: month,
    matricula: registration
  });

  const response = await fetch(`${apiUrl}?${params.toString()}`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
};

export const fetchAllUsersHours = async (month: string) => {
  const apiUrl = `https://script.google.com/macros/s/AKfycbxmUSgKPVz_waNPHdKPT1y8x52xPNS9Yzqx_u1mlH83OabndJQ8Ie2ZZJVJnLIMNOb4/exec`;
  const params = new URLSearchParams({
    mes: month,
    todos: 'true'
  });

  const response = await fetch(`${apiUrl}?${params.toString()}`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
};
