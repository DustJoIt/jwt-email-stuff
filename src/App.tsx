import React from 'react';
import './App.css';

export function App() {
    const authToken = React.useRef<string>(null);
    const [showEmailForm, setShowEmailForm] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [serverAnswer, setServerAnswer] = React.useState<string[]>([]);

    React.useEffect(() => {
        // @ts-ignore
        authToken.current = localStorage.getItem('authToken');
    }, []);

    const getData = React.useCallback(async () => {
        try {
            if (authToken.current) {
                const resp = await fetch(`/getData/${authToken.current}`).then(res =>
                {
                    if (res.status >= 300 || res.status <= 199) {
                        throw new Error();
                    }
                    return res.text()
                }
                );
                console.log(resp);

                setServerAnswer(prevState => [...prevState, resp as string])
            } else {
                setShowEmailForm(true);
            }
        } catch (e) {
            // @ts-ignore
            authToken.current = null;
            localStorage.removeItem('authToken');
            setShowEmailForm(true);
            setServerAnswer([]);
        }

    }, [authToken, setServerAnswer, setShowEmailForm])

    const auth = async () => {
        try {
            const tryResponse = fetch('/auth', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email
                })
            }).then(res => res.text())

            alert('Email отправлен, не закрывайте страницу');

            const response = await tryResponse;

            // @ts-ignore
            authToken.current = response;
            setShowEmailForm(false);
            localStorage.setItem('authToken', response);
        } catch (e) {
            alert('Что-то пошло не так');
        }
    };

  return (
    <div className="App">
      <button className="cool_button" onClick={getData}>
        Запросить доступ к конфеденциальной информации
      </button>
        {showEmailForm && (
            <div className="form">
                <h3>Введите адрес почты</h3>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email"/>
                <button onClick={auth}>
                    Авторизация
                </button>
            </div>

        )}
        <div className={"server_output"}>
            {serverAnswer}
        </div>
    </div>
  );
}
