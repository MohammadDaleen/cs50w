function App() {
    const [state, setState] = useState({
        posts: [],
    });

    function fetchPosts() {
        fetch('/allPosts')
        .then(response => response.json())
        .then(result => {
            setState({
                ...state,
                posts: result
            });
        })
        .catch(error => {
            console.log("Error:", error);
        });
    }

    useEffect(() => {
        fetchPosts();
    }, []);

    function handleNewPost(newPost) {
        // Logic to submit the new post to the server
        if (newPost.length !== 0) {
            fetch('/newPost', {
                method: 'POST',
                body: JSON.stringify({
                    post: newPost.trim()
                })
            })
            // Turn response to JSON (and name it result)
            .then(response => response.json())
            .then(result => {
                // Check for any error
                const noError = 'error' in result ? false : true;
                // Ensure result is true
                if (noError){
                    // Refresh the posts
                    fetchPosts();
                }
                console.log(result)
            })
            .catch(error => {
                console.log("Error:", error);
            });
        }
    };
    
    return (
        <>
            <NewPostForm onNewPost={handleNewPost}/>
            <AllPosts posts={state.posts} />
        </>
    );
}

ReactDOM.render(<App />, document.querySelector("#app"));