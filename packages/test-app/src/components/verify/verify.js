import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { verifySignUp } from "../../store/actions/authActions";
import { PageLoadingSpinner } from "../../components";

const Verify = ({
  verifySignUp,
  isLoading
}) => {
  useEffect(() => {
    verifySignUp();
  }, [verifySignUp]);

  if (isLoading) {
    return <Redirect to="/dashboard" />;
  }

  return <PageLoadingSpinner />;
};

const mapStateToProps = (
  state
) => {
  const { firebase: { auth: { uid } }, auth: { isVerifyingUser, isVerified } } = state;

  const isLoading = uid && !isVerifyingUser && isVerified;
  return {
    isLoading
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    verifySignUp: () => dispatch(verifySignUp()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Verify);