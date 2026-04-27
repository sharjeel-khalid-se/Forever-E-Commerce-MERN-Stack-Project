import React, { useContext, useEffect } from 'react';
import {useSearchParams} from 'react-router-dom'
import {toast} from 'react-toastify'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext';

const Verify = () => {
    
    const { navigate, setCartItems, token, backendUrl } = useContext(ShopContext)

    const [searchParams, setSearchParams] = useSearchParams()

    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const verifyPayment = async ()=>{
        try {
            if(!token){
                toast.error('Login please')
                // navigate(backendUrl + 'login')
                return null
            }

            const response = await axios.post(backendUrl + '/api/orders/verifyStripe', {success, orderId, userId: token}, {headers : {token}})


            if(response.data.success){
                setCartItems({})
                navigate('/orders')
            } else {
                toast.error('Try Again')
                navigate('/cart')
            }

        } catch (error) {
           console.log(error) 
           toast.error(error.message)
        }
    }

    useEffect(()=>{
        verifyPayment()
    }, [])
  return (
    <div>
      
    </div>
  );
}

export default Verify;
