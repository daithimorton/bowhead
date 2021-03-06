import { useSelector, useDispatch } from "react-redux";
import { sendSignInEmailLink } from "../../../actions/authActions";

const useSignIn = () => {
  const state = useSelector((state) => state);
  const dispatch = useDispatch()

  const {
    bowhead, firebase: { auth: { uid } }
  } = state;

  const { sendEmailAuthError, isSendingEmailLink, isEmailLinkSent } = bowhead;

  const handleSendSignInEmailLink = ({ email }) => {
    dispatch(sendSignInEmailLink({ email }))
  }

  return {
    sendEmailAuthError,
    handleSendSignInEmailLink,
    isSendingEmailLink,
    isEmailLinkSent,
    uid,
  };
};

export default useSignIn;
