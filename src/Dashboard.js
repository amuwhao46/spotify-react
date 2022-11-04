import { useState, useEffect } from "react"
import useAuth from "./useAuth"
import TrackSearchResult from "./TrackSearchResult"
import { Container, Form } from "react-bootstrap"
import SpotifyWebApi from "spotify-web-api-node"
import Player from "./Player"

const spotifyApi = new SpotifyWebApi({
    clientId: 'fc24ace5aa794c269a5723ac954569e9',
})

export default function Dashboard({ code }) {
    const accessToken = useAuth(code)
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])

    useEffect(() => {
        if (!accessToken) return
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(() => {
        if (!search) return setSearchResults([])
        if (!accessToken) return

        // Cancels search if a new request happens
        let cancel = false

        spotifyApi.searchTracks(search)
        .then(res => {
            if (cancel) return
            // Instead of for loop :D
            setSearchResults(res.body.tracks.items.map(track => {
                const smallestAlbumImage = track.album.images.reduce(
                    (smallest, image) => {
                        if (image.height < smallest.height) return image 
                        return smallest
                    }, track.album.images[0])

                return {
                    artistName: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url,
                }
            }))
        })

        return () => cancel = true
    }, [search, accessToken])

    return <Container className="d-flex flex-column py-2" style={{height: "100vh"}}>
        <Form.Control 
        type="search" 
        placeholder="Search Songs or Artists" 
        value={search} 
        onChange= {e => setSearch(e.target.value)}
        />
        <div className="flex-grow-1 my-2" style={{overflowY: "auto"}}>
            {searchResults.map(track => (
                <TrackSearchResult track={track} key={track.uri} />
            ))}
        </div>
        <div><Player /></div>
    </Container>
}
