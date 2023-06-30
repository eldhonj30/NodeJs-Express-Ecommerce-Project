
function addToCart(proId) {
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        Swal.fire({
          title: 'Success!',
          text: 'Item added to cart. Do you want to go to the cart?',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Yes',
          cancelButtonText: 'No'
        }).then((result) => {
          if (result.isConfirmed) {
            let count = $('#cart-count').html();
            count = parseInt(count) + 1;
            $("#cart-count").html(count);
            location.href = '/cart';
          }
        });
      }
    }
  });
}
