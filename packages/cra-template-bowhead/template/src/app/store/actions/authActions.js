import { AUTH_TYPE } from "../../../utils/constants";
import {
  userSignOut,
  authenticateEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  deleteLoggedInFirebaseUser
} from '../../api/firebase'
import {
  removeUserFromWorkspace,
  verifyUserInviteUpdate,
  verifyUserSignInUpdate,
  updateMemberStatus,
  deleteUserAccountAndData
} from "../../api/firestore";
import { deleteStripeCustomerAndSubscription } from '../../api/stripe'

export const resetSendEmailLink = () => {
  return dispatch => {
    dispatch({ type: "SEND_EMAIL_LINK_RESET" });
  };
};

export const signOut = () => {
  return async (dispatch) => {
    dispatch({ type: "SIGNING_OUT" });

    await userSignOut()
      .then(() => {
        dispatch({ type: "SIGN_OUT_SUCCESS" });
      })
      .catch(error => {
        dispatch({ type: "SIGN_OUT_ERROR", error });
      });
  };
};

export const authenticateWithEmailLink = ({ email, ref, data }) => {
  return async (dispatch) => {
    dispatch({ type: "SEND_EMAIL_LINK" });

    await authenticateEmail({ email, ref, data })
      .then(() => {
        window.localStorage.setItem("emailForSignIn", email);

        // invite
        if (ref === AUTH_TYPE.INVITE) {
          const { workspaceId } = data;
          return updateMemberStatus({ workspaceId, email, status: "pending" })
        }
      })
      .then(() => {
        dispatch({ type: "SEND_EMAIL_LINK_SUCCESS" });
      })
      .catch(error => {
        dispatch({ type: "SEND_EMAIL_LINK_ERROR", error });
      });
  };
};

export const verifySignUp = () => {
  return async (dispatch) => {
    dispatch({ type: "VERIFY_USER" });

    // get url params
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (isSignInWithEmailLink({ location: window.location.href })) {
      var email = window.localStorage.getItem("emailForSignIn");
      window.localStorage.removeItem("emailForSignIn");
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        email = window.prompt("Please provide your email for confirmation");
      }

      await signInWithEmailLink({ email, location: window.location.href })
        .then(async result => {
          const uid = result.user.uid;

          // invite
          if (ref === AUTH_TYPE.INVITE) {
            const workspaceId = params.get("workspaceId");
            const workspaceName = params.get("workspaceName");

            await verifyUserInviteUpdate({ workspaceId, workspaceName, email, uid })
              .then(() => {
                dispatch({ type: "VERIFY_USER_SUCCESS" });
              })
              .catch(error => {
                dispatch({ type: "VERIFY_USER_ERROR", error });
              });
          } else if (AUTH_TYPE.SIGN_IN) {
            await verifyUserSignInUpdate({ uid, email })
              .then(() => {
                dispatch({ type: "VERIFY_USER_SUCCESS" });
              })
              .catch(error => {
                dispatch({ type: "VERIFY_USER_ERROR", error });
              });
          }
        })
        .catch(error => {
          dispatch({ type: "VERIFY_USER_ERROR", error });
        });
    }
  };
};

export const deleteCurrentUserAccount = ({ uid, customer }) => {
  return async (dispatch) => {
    dispatch({ type: "DELETING_USER_DATA" });

    // stripe
    customer && await deleteStripeCustomerAndSubscription(customer)
      .then((response) => {
        if (!response.ok) {
          dispatch({ type: "DELETING_USER_DATA_ERROR", error: 'failed to delete stripe customer data' });
        }
      })
      .catch(error => {
        dispatch({ type: "DELETING_USER_DATA_ERROR", error });
      })

    // user
    await deleteUserAccountAndData(uid)
      .catch(error => {
        dispatch({ type: "DELETING_USER_DATA_ERROR", error });
      })

    await deleteLoggedInFirebaseUser()
      .catch(error => {
        if (error.code === "auth/requires-recent-login") {
          window.alert("Your login credentials need to be re-verified. Please login again and retry your previous action. We do this to make sure your data stays safe.");
          dispatch({ type: "DELETING_USER_DATA_ERROR", error });
          userSignOut();
        }
      });

    // done
    dispatch({ type: "DELETING_USER_DATA_SUCCESS" });
  }
};

export const removeMember = ({ uid, workspaceId, email }) => {
  return (dispatch) => {
    dispatch({ type: "REMOVE_MEMBER" });

    return removeUserFromWorkspace({ uid, workspaceId, email })
      .then(() => {
        dispatch({ type: "REMOVE_MEMBER_SUCCESS" });
      })
      .catch(error => {
        dispatch({ type: "REMOVE_MEMBER_ERROR", error });
      });
  };
};