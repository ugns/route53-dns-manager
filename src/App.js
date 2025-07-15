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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
