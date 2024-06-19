const { useState } = React;

function App() {
    const [test, setTest] = useState(false);
    
    return (
        <div>
            Hello, React!
            <button onClick={() => {setTest(prev => !prev)}}>
                change me
            </button>
            {test ? "true" : "false"}
        </div>
    );
}

ReactDOM.render(<App />, document.querySelector("#app"));