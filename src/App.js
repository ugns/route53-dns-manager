import GoogleLoginWrapper from './GoogleLoginWrapper';

function App() {
  return (
    <div className="App">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <GoogleLoginWrapper />
              </div>
              <div className="card-footer bg-transparent border-0 text-center">
                <small className="text-muted">
                  Powered by Bluesky Route53 DNS Manager &nbsp;|&nbsp;
                  <a href="/privacy-policy.html" className="text-decoration-underline text-muted" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
