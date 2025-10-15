import React from "react";
import "./SignUp.css";
import laptopImage1 from "/laptop1.png";
import laptopImage2 from "/laptop2.png";

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Section 1 */}
      <section className="section light-bg">
        <div className="content">
          <h1 className="pacifico-regular" 
          style= {{
            fontSize: '4rem',
            marginTop: '-150px',

          }}>Savr</h1>

          <div className="anybody">
            <h2
              style={{
                fontSize: "3.5rem",
                marginTop: "70px",
                lineHeight: "1",
              }}
            >
              Never Worry About
               <br />
               What to Make for
              <br/>
              Your Next Meal Again
            </h2>

            <p
              className="anybody"
              style={{
                fontWeight: 300,
                marginTop: "50px",
                lineHeight: "1.2",
                fontSize: "1.25rem",
              }}
            >
              Tired of spending hours planning your meals for the week?
              <br />
              <span style={{ display: "inline-block", marginTop: "30px" }}>
              That’s why we created Savr — the AI kitchen companion
             <br />
             that turns your ingredients into instant,delicious 
              <br />
             recipes made just for you.
              </span>
            </p>

            <button className="btn" style={{ marginTop: "50px" }}>
              Start Planning
            </button>
          </div>
        </div>

        {/* Laptop container */}
        <div className="laptop-box">
          <img
            src={laptopImage1}
            alt="Savr app preview"
            className="laptop"
          />
        </div>
      </section>

      {/* Section 2 */}
      <section className="section white-bg">
        <div className="content">
          <h1 className="logo">Savr</h1>
          <div className="text">
            <h2>
              Hi, I’m Savr, the{" "}
              <span className="highlight">AI kitchen companion.</span>
            </h2>
            <p className="desc">
              I take the stress out of meal planning. By learning your tastes,
              preferences, and schedule, I craft personalized recipes and weekly
              meal plans made just for you — in minutes. Simply upload your
              grocery receipt, and I’ll turn what you already have into
              delicious, customized meals effortlessly.
            </p>
            <button className="btn">Start Planning</button>
          </div>
        </div>

        <div >
          <img
            src={laptopImage2}
            alt="Savr AI planner preview"
            className="laptop"
          />
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
